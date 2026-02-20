import { toast } from 'sonner'
import { supabase } from './supabase'

const BUCKET_NAME = 'task-attachments'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function uploadFilesForTask(taskId: string, files: File[]) {
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) {
    toast.error('You must be logged in to upload files')
    return
  }

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File "${file.name}" is too large. Maximum size is 10MB.`)
      continue
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${taskId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      toast.error(`Failed to upload ${file.name}`)
      continue
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadData.path)

    const { error: dbError } = await supabase
      .from('task_attachments')
      .insert({
        task_id: taskId,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        user_id: userId,
      })

    if (dbError) {
      console.error('DB error:', dbError)
      toast.error(`Failed to save attachment record for ${file.name}`)
      continue
    }
  }

  if (files.length > 0) {
    toast.success(`${files.length} file${files.length > 1 ? 's' : ''} uploaded`)
  }
}
