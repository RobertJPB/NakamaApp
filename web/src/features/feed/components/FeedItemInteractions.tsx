import React, { useState } from 'react'
import { Heart, MessageSquare, Trash2, X } from 'lucide-react'
import styles from './FeedItemInteractions.module.css'
import { api } from '../../../lib/axios'
import { useAuth } from '../../../hooks/useAuth'

interface FeedItemInteractionsProps {
  itemId: string
  tipo: string
  isOwner: boolean
  initialLikes: number
  initialHasLiked: boolean
  initialCommentsCount: number
  onDeleted: (id: string) => void
}

export const FeedItemInteractions: React.FC<FeedItemInteractionsProps> = ({
  itemId,
  tipo,
  isOwner,
  initialLikes,
  initialHasLiked,
  initialCommentsCount,
  onDeleted
}) => {
  const { usuario } = useAuth()
  const [likes, setLikes] = useState(initialLikes || 0)
  const [hasLiked, setHasLiked] = useState(initialHasLiked || false)
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount || 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const handleLike = async () => {
    try {
      setHasLiked(!hasLiked)
      setLikes(prev => Math.max(0, hasLiked ? prev - 1 : prev + 1))
      const res = await api.post(`/api/feed/${tipo}/${itemId}/like`)
      if (res.data.accion === 'liked') {
        setHasLiked(true)
      } else {
        setHasLiked(false)
      }
    } catch (err) {
      console.error(err)
      setHasLiked(hasLiked)
      setLikes(likes)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/feed/${tipo}/${itemId}`)
      setShowConfirmDelete(false)
      onDeleted(itemId)
    } catch (err) {
      console.error(err)
      alert('Error al eliminar')
    }
  }

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true)
      try {
        const res = await api.get(`/api/feed/${tipo}/${itemId}/comentarios`)
        setComments(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingComments(false)
      }
    }
    setShowComments(!showComments)
  }

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    try {
      const res = await api.post(`/api/feed/${tipo}/${itemId}/comentarios`, { contenido: newComment })
      setComments(prev => [...prev, res.data])
      setCommentsCount(prev => prev + 1)
      setNewComment('')
    } catch (err) {
      console.error(err)
      alert('Error al enviar comentario')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('¿Seguro que quieres eliminar este comentario?')) return
    try {
      await api.delete(`/api/feed/${tipo}/${itemId}/comentarios/${commentId}`)
      setComments(prev => prev.filter(c => c.id !== commentId))
      setCommentsCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error(err)
      alert('Error al eliminar comentario')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.actionBar}>
        <button 
          className={`${styles.actionBtn} ${hasLiked ? styles.liked : ''}`} 
          onClick={handleLike}
        >
          <Heart size={18} fill={hasLiked ? "currentColor" : "none"} />
          <span>{likes}</span>
        </button>

        <button className={styles.actionBtn} onClick={toggleComments}>
          <MessageSquare size={18} />
          <span>{commentsCount}</span>
        </button>

        {isOwner && (
          <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => setShowConfirmDelete(true)} title="Eliminar">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {showComments && (
        <div className={styles.commentsSection}>
          {loadingComments ? (
            <div className={styles.loading}>Cargando comentarios...</div>
          ) : (
            <div className={styles.commentsList}>
              {comments.map(c => (
                <div key={c.id} className={styles.comment}>
                  <img src={c.usuario.avatarUrl || `https://ui-avatars.com/api/?name=${c.usuario.username}`} alt="avatar" className={styles.commentAvatar} />
                  <div className={styles.commentBody}>
                    <div className={styles.commentHeader}>
                      <span className={styles.commentUsername}>{c.usuario.nombreDisplay || c.usuario.username}</span>
                      <span className={styles.commentDate}>
                        {new Date(c.creadoEn).toLocaleDateString('es-DO', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                      </span>
                      {c.usuario.id === usuario?.id && (
                        <button onClick={() => handleDeleteComment(c.id)} className={styles.deleteCommentBtn} title="Eliminar comentario">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <div className={styles.commentText}>{c.contenido}</div>
                  </div>
                </div>
              ))}
              {comments.length === 0 && <div className={styles.noComments}>Aún no hay comentarios.</div>}
            </div>
          )}

          <form onSubmit={submitComment} className={styles.commentForm}>
            <input 
              type="text" 
              placeholder="Escribe un comentario..." 
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className={styles.commentInput}
            />
            <button type="submit" className={styles.commentSubmit} disabled={!newComment.trim()}>
              Enviar
            </button>
          </form>
        </div>
      )}

      {showConfirmDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>¿Seguro que quieres eliminar esto?</h3>
            <p className={styles.modalText}>Esta acción no se puede deshacer.</p>
            <div className={styles.modalActions}>
              <button className={styles.modalBtnCancel} onClick={() => setShowConfirmDelete(false)}>Cancelar</button>
              <button className={styles.modalBtnDelete} onClick={handleDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
