import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Category } from '../types'

export function useCategories() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const queryKey = ['categories']

  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      return (data as Category[]) || []
    },
    enabled: !!user,
  })

  const addCategory = async (category: Omit<Category, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('categories')
      .insert({ ...category, user_id: user?.id })
      .select()
      .single()

    if (error) {
      console.error('Failed to add category:', error)
      return null
    }
    await queryClient.invalidateQueries({ queryKey })
    return data as Category
  }

  const updateCategory = async (id: string, updates: Partial<Omit<Category, 'id' | 'created_at'>>) => {
    const { error } = await supabase.from('categories').update(updates).eq('id', id)
    if (error) {
      console.error('Failed to update category:', error)
      return false
    }
    await queryClient.invalidateQueries({ queryKey })
    return true
  }

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete category:', error)
      return false
    }
    await queryClient.invalidateQueries({ queryKey })
    return true
  }

  return {
    categories,
    loading,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
    addCategory,
    updateCategory,
    deleteCategory,
  }
}
