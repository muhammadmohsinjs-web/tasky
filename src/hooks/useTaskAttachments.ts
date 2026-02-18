import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { TaskAttachment } from '../types'

const BUCKET_NAME = 'task-attachments'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function useTaskAttachments(taskId: string | null) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)

  const fetchAttachments = useCallback(async () => {
    if (!taskId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('task_attachments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch attachments:', error)
    } else {
      setAttachments(data || [])
    }
    setLoading(false)
  }, [taskId])

  const uploadFile = async (file: File): Promise<TaskAttachment | null> => {
    if (!taskId) return null
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Maximum size is 10MB.`)
      return null
    }
    setUploading(true)
    try {
      // Get current user ID from session
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id
      if (!userId) {
        toast.error('You must be logged in to upload files')
        return null
      }

      // Generate unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${taskId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        toast.error('Failed to upload file')
        return null
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(uploadData.path)

      // Create database record
      const { data: attachmentData, error: dbError } = await supabase
        .from('task_attachments')
        .insert({
          task_id: taskId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          user_id: userId,
        })
        .select()
        .single()

      if (dbError) {
        console.error('DB error:', dbError)
        toast.error('Failed to save attachment record')
        return null
      }

      const newAttachment = attachmentData as TaskAttachment
      setAttachments((prev) => [newAttachment, ...prev])
      toast.success('File uploaded')
      return newAttachment
    } catch (err) {
      console.error('Upload failed:', err)
      toast.error('Upload failed')
      return null
    } finally {
      setUploading(false)
    }
  }

  const deleteAttachment = async (id: string, fileUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split(`/${BUCKET_NAME}/`)
      const filePath = urlParts[1]

      // Delete from storage
      if (filePath) {
        await supabase.storage.from(BUCKET_NAME).remove([filePath])
      }

      // Delete from database
      const { error } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Failed to delete attachment:', error)
        toast.error('Failed to delete attachment')
        return
      }

      setAttachments((prev) => prev.filter((a) => a.id !== id))
      toast.success('Attachment deleted')
    } catch (err) {
      console.error('Delete failed:', err)
      toast.error('Delete failed')
    }
  }

  return {
    attachments,
    loading,
    uploading,
    fetchAttachments,
    uploadFile,
    deleteAttachment,
  }
}
