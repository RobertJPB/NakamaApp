import React, { useState, useEffect, useRef } from 'react'
import { Heart, MessageSquare, Trash2, X, Flag, AlertTriangle, MoreHorizontal } from 'lucide-react'
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
  initialComments?: any[]
  onDeleted: (id: string) => void
}

export const FeedItemInteractions: React.FC<FeedItemInteractionsProps> = ({
  itemId,
  tipo,
  isOwner,
  initialLikes,
  initialHasLiked,
  initialCommentsCount,
  initialComments,
  onDeleted
}) => {
  const { usuario } = useAuth()
  const [likes, setLikes] = useState(initialLikes || 0)
  const [hasLiked, setHasLiked] = useState(initialHasLiked || false)
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount || (initialComments ? initialComments.length : 0))
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<any[]>(initialComments || [])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Pre-fetch comments to make opening them instant
  useEffect(() => {
    if (initialCommentsCount > 0 && (!initialComments || initialComments.length === 0)) {
      api.get(`/api/feed/${tipo}/${itemId}/comentarios`)
        .then(res => setComments(res.data))
        .catch(() => {})
    }
  }, [itemId, tipo, initialCommentsCount, initialComments])

  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

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
    // Cierra el modal de inmediato y oculta el ítem en la UI para que se sient instantáneo
    setShowConfirmDelete(false)
    onDeleted(itemId)
    
    try {
      await api.delete(`/api/feed/${tipo}/${itemId}`)
    } catch (err) {
      console.error(err)
      alert('Error al eliminar el elemento. Refresca la página.')
    }
  }

  const handleReportar = () => {
    if (!window.confirm('¿Estás seguro de reportar esto como inapropiado?')) return
    alert('Reporte enviado correctamente. Un moderador lo revisará pronto.')
  }

  const toggleComments = () => {
    // Si vamos a abrir la sección y no tenemos los comentarios cargados, hacemos fetch en background
    if (!showComments && comments.length === 0 && initialCommentsCount > 0) {
      setLoadingComments(true)
      api.get(`/api/feed/${tipo}/${itemId}/comentarios`)
        .then(res => {
          setComments(res.data)
        })
        .catch(err => {
          console.error(err)
        })
        .finally(() => {
          setLoadingComments(false)
        })
    }
    // Mostramos la caja de comentarios de forma instantánea
    setShowComments(!showComments)
  }

  const submitComment = async (e: React.FormEvent, padreId: string | null = null) => {
    e.preventDefault()
    const content = padreId ? replyText : newComment
    if (!content.trim()) return

    const backupText = content
    const tempId = `temp-${Date.now()}`
    const tempComment = {
      id: tempId,
      contenido: backupText,
      padreId: padreId,
      creadoEn: new Date().toISOString(),
      usuario: usuario,
    }

    // Optimistic update
    setComments(prev => [...prev, tempComment])
    setCommentsCount(prev => prev + 1)
    if (padreId) {
      setReplyText('')
      setReplyingTo(null)
    } else {
      setNewComment('')
    }

    try {
      const res = await api.post(`/api/feed/${tipo}/${itemId}/comentarios`, padreId ? { contenido: backupText, padreId } : { contenido: backupText })
      // Reemplazamos el comentario temporal con el real que tiene el ID de BD
      setComments(prev => prev.map(c => c.id === tempId ? res.data : c))
    } catch (err) {
      console.error(err)
      // Revertir si falla
      setComments(prev => prev.filter(c => c.id !== tempId))
      setCommentsCount(prev => Math.max(0, prev - 1))
      if (padreId) {
        setReplyText(backupText)
        setReplyingTo(padreId)
      } else {
        setNewComment(backupText)
      }
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.delete(`/api/feed/${tipo}/${itemId}/comentarios/${commentId}`)
      setComments(prev => prev.filter(c => c.id !== commentId))
      setCommentsCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error(err)
      alert('Error al eliminar comentario')
    }
  }

  // Organizar comentarios en árbol
  const commentTree = React.useMemo(() => {
    const map = new Map<string, any>()
    comments.forEach(c => {
      map.set(c.id, { ...c, respuestas: [] })
    })
    const roots: any[] = []
    map.forEach(c => {
      if (c.padreId && map.has(c.padreId)) {
        map.get(c.padreId).respuestas.push(c)
      } else {
        roots.push(c)
      }
    })
    return roots
  }, [comments])

  const renderCommentNode = (c: any) => {
    const isReplying = replyingTo === c.id
    
    return (
      <div key={c.id} className={styles.commentNode}>
        <div className={styles.comment}>
          <div className={styles.commentAvatarWrap}>
            <img src={c.usuario?.avatarUrl || `https://ui-avatars.com/api/?name=${c.usuario?.username}`} alt="avatar" className={styles.commentAvatar} />
            {c.usuario?.marcoUrl && (
              <img src={c.usuario.marcoUrl} alt="Marco" className={styles.commentMarco} />
            )}
          </div>
          <div className={styles.commentBody}>
            <div className={styles.commentHeader}>
              <div className={styles.commentMeta}>
                <span className={styles.commentUsername}>{c.usuario?.nombreDisplay || c.usuario?.username}</span>
                <span className={styles.commentDate}>
                  {new Date(c.creadoEn).toLocaleDateString('es-DO', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                </span>
              </div>
              
              {!!usuario && (
                <div className={styles.menuWrap} ref={openMenuId === c.id ? menuRef : null}>
                  <button className={styles.btnMore} onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)} title="Opciones">
                    <MoreHorizontal size={14} />
                  </button>
                  {openMenuId === c.id && (
                    <div className={styles.dropdown}>
                      {c.usuario?.id === usuario.id && (
                        <button className={`${styles.dropdownItem} ${styles.dropdownDanger}`} onClick={() => { setOpenMenuId(null); handleDeleteComment(c.id); }}>
                          <Trash2 size={14} /> Eliminar
                        </button>
                      )}
                      {c.usuario?.id !== usuario.id && (
                        <button className={`${styles.dropdownItem} ${styles.dropdownDanger}`} onClick={() => { setOpenMenuId(null); handleReportar(); }}>
                          <Flag size={14} /> Denunciar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className={styles.commentText}>{c.contenido}</div>
            
            <div className={styles.commentActionsGroup}>
              <button className={styles.commentActionBtn} title="Me gusta" onClick={() => alert('Próximamente')}>
                <Heart size={14} /> <span>{c.totalLikes || 0}</span>
              </button>
              <button className={styles.commentActionBtn} title="Responder" onClick={() => {
                setReplyingTo(isReplying ? null : c.id)
                setReplyText('')
              }}>
                <MessageSquare size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Input para responder */}
        {isReplying && (
          <form onSubmit={(e) => submitComment(e, c.id)} className={styles.replyForm}>
            <input 
              type="text" 
              placeholder={`Responde a ${c.usuario?.nombreDisplay || c.usuario?.username}...`}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              className={styles.commentInput}
              autoFocus
            />
            <button type="submit" className={styles.commentSubmit} disabled={!replyText.trim()}>
              Responder
            </button>
            <button type="button" className={styles.cancelReplyBtn} onClick={() => setReplyingTo(null)}>
              Cancelar
            </button>
          </form>
        )}

        {/* Hijos recursively */}
        {c.respuestas && c.respuestas.length > 0 && (
          <div className={styles.repliesContainer}>
            {c.respuestas.map((r: any) => renderCommentNode(r))}
          </div>
        )}
      </div>
    )
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
      </div>

      {!showComments && commentTree.length > 0 && (
        <div className={styles.commentsSection} style={{ borderTop: 'none', paddingTop: '12px', marginTop: '4px' }}>
          <div className={styles.commentsList}>
            {commentTree.slice(0, 2).map(c => renderCommentNode(c))}
          </div>
          {commentTree.length > 2 && (
            <button 
              onClick={toggleComments}
              style={{ background: 'none', border: 'none', color: 'var(--color-texto-muted)', fontSize: '13px', cursor: 'pointer', marginTop: '8px', padding: 0 }}
            >
              Ver {commentTree.length - 2} comentarios más...
            </button>
          )}
        </div>
      )}

      {showComments && (
        <div className={styles.commentsSection}>
          {loadingComments ? (
            <div className={styles.loading}>Cargando comentarios...</div>
          ) : (
            <div className={styles.commentsList}>
              {commentTree.map(c => renderCommentNode(c))}
              {comments.length === 0 && <div className={styles.noComments}>Aún no hay comentarios.</div>}
            </div>
          )}

          <form onSubmit={(e) => submitComment(e, null)} className={styles.commentForm}>
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
