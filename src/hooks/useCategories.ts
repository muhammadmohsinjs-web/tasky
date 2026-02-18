import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_CATEGORIES } from '../lib/defaultCategories'
import { useAuth } from '../contexts/AuthContext'
import type { Category } from '../types'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch categories:', error)
      setCategories([])
      setLoading(false)
      return
    }

    if (!data || data.length === 0) {
      const seeded = DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: user?.id }))
      const { data: inserted, error: insertError } = await supabase
        .from('categories')
        .insert(seeded)
        .select()

      if (insertError) {
        console.error('Failed to seed categories:', insertError)
        setCategories([])
      } else {
        setCategories(inserted as Category[])
      }
      setLoading(false)
      return
    }

    setCategories(data as Category[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

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
    setCategories((prev) => [...prev, data as Category])
    return data as Category
  }

  const updateCategory = async (id: string, updates: Partial<Omit<Category, 'id' | 'created_at'>>) => {
    const { error } = await supabase.from('categories').update(updates).eq('id', id)
    if (error) {
      console.error('Failed to update category:', error)
      return false
    }
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
    return true
  }

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete category:', error)
      return false
    }
    setCategories((prev) => prev.filter((c) => c.id !== id))
    return true
  }

  return { categories, loading, refetch: fetchCategories, addCategory, updateCategory, deleteCategory }
}
