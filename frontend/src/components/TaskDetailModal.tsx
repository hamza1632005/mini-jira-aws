"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import * as api from "@/lib/api";
import type { Comment, Task } from "@/lib/types";
import { STATUS_COLUMNS } from "@/lib/types";
import { inputClass, inputClassInline, selectClass } from "@/lib/styles";
import { useAuth } from "@/context/AuthContext";

interface TaskDetailModalProps {
  task: Task | null;
  token: string;
  onClose: () => void;
  onUpdated: (task: Task) => void;
  onDeleted?: (taskId: string) => void;
}

export function TaskDetailModal({
  task,
  token,
  onClose,
  onUpdated,
  onDeleted,
}: TaskDetailModalProps) {
  const { isManager, user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(task);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("Medium");
  const [editDeadline, setEditDeadline] = useState("");
  const [editAssigneeUsername, setEditAssigneeUsername] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  useEffect(() => {
    setCurrentTask(task);
    if (task) {
      setEditTitle(task.title);
      setEditDescription(task.description || "");
      setEditPriority(task.priority);
      setEditDeadline(task.deadline || "");
      setEditAssigneeUsername("");
    }
    setEditing(false);
  }, [task]);

  const loadComments = useCallback(async () => {
    if (!task) return;
    setLoadingComments(true);
    try {
      const data = await api.getComments(token, task.taskId);
      setComments(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load comments");
    } finally {
      setLoadingComments(false);
    }
  }, [task, token]);

  useEffect(() => {
    if (task) {
      loadComments();
    } else {
      setComments([]);
      setCommentText("");
    }
  }, [task, loadComments]);

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editTitle.trim()) return;
    setSavingEdit(true);
    try {
      let assigneeId: string | undefined = currentTask!.assigneeId;
      if (editAssigneeUsername.trim()) {
        const user = await api.lookupUser(token, editAssigneeUsername.trim());
        assigneeId = user.userId;
      }

      const updated = await api.updateTask(token, task!.taskId, {
        title: editTitle,
        description: editDescription || undefined,
        priority: editPriority,
        deadline: editDeadline || undefined,
        assigneeId,
        ...(editAssigneeUsername.trim() && { assigneeUsername: editAssigneeUsername.trim() }),
      });
      setCurrentTask(updated);
      onUpdated(updated);
      setEditing(false);
      toast.success("Task updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.deleteTask(token, task!.taskId);
      toast.success("Task deleted");
      onDeleted?.(task!.taskId);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSaveComment(commentId: string) {
    if (!editingCommentText.trim()) return;
    setSavingComment(true);
    try {
      const updated = await api.updateComment(token, task!.taskId, commentId, editingCommentText.trim());
      setComments((prev) => prev.map((c) => (c.commentId === commentId ? updated : c)));
      setEditingCommentId(null);
      toast.success("Comment updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update comment");
    } finally {
      setSavingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    setDeletingCommentId(commentId);
    try {
      await api.deleteComment(token, task!.taskId, commentId);
      setComments((prev) => prev.filter((c) => c.commentId !== commentId));
      toast.success("Comment deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete comment");
    } finally {
      setDeletingCommentId(null);
    }
  }

  if (!task || !currentTask) return null;

  async function handleAddComment(e: FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await api.addComment(token, task!.taskId, commentText.trim());
      setCommentText("");
      await loadComments();
      toast.success("Comment added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { uploadUrl } = await api.getUploadUrl(token, task!.taskId);
      await api.uploadFile(uploadUrl, file);
      const updated = await api.getTask(token, task!.taskId);
      setCurrentTask(updated);
      onUpdated(updated);
      toast.success("File uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const statusLabel =
    STATUS_COLUMNS.find((c) => c.id === currentTask.status)?.label ||
    currentTask.status;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-zinc-200 p-5">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">{currentTask.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{statusLabel} · {currentTask.priority}</p>
          </div>
          <div className="flex items-center gap-1">
            {isManager && !editing && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </>
            )}
            {editing && (
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100"
              >
                Cancel
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-5 p-5">
          {editing ? (
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Title *"
                className={inputClass}
                required
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Description"
                rows={2}
                className={inputClass}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className={selectClass + " w-full"}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <input
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className={inputClass}
                />
              </div>
              <input
                type="text"
                value={editAssigneeUsername}
                onChange={(e) => setEditAssigneeUsername(e.target.value)}
                placeholder={currentTask!.assigneeId ? "New assignee username (leave blank to keep)" : "Assignee username"}
                className={inputClass}
              />
              <button
                type="submit"
                disabled={savingEdit}
                className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingEdit ? "Saving…" : "Save Changes"}
              </button>
            </form>
          ) : (
            <>
              {currentTask.description && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700">Description</h3>
                  <p className="mt-1 text-sm text-zinc-600">{currentTask.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {currentTask.deadline && (
                  <div>
                    <span className="text-zinc-500">Deadline</span>
                    <p className="font-medium">{new Date(currentTask.deadline).toLocaleDateString()}</p>
                  </div>
                )}
                {currentTask.assigneeId && (
                  <div>
                    <span className="text-zinc-500">Assignee</span>
                    <p className="truncate font-medium">
                      {currentTask.assigneeUsername ?? currentTask.assigneeId}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          <div>
            <h3 className="text-sm font-semibold text-zinc-700">Attachments</h3>
            {currentTask.attachments && currentTask.attachments.length > 0 ? (
              <ul className="mt-1 space-y-1">
                {currentTask.attachments.map((key) => (
                  <li key={key} className="truncate text-xs text-zinc-500">
                    {key.split("/").pop()}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-zinc-400">No attachments</p>
            )}
            <label className="mt-2 inline-block cursor-pointer rounded-lg border-2 border-zinc-400 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100">
              {uploading ? "Uploading…" : "Upload file"}
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-700">Comments</h3>
            {loadingComments ? (
              <div className="mt-2 h-8 animate-pulse rounded bg-zinc-100" />
            ) : comments.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-600">No comments yet</p>
            ) : (
              <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                {comments.map((c) => (
                  <li key={c.commentId} className="rounded-lg bg-zinc-50 p-2 text-sm">
                    {editingCommentId === c.commentId ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className="w-full rounded border border-zinc-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveComment(c.commentId)}
                            disabled={savingComment}
                            className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
                          >
                            {savingComment ? "Saving…" : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingCommentId(null)}
                            className="text-xs font-medium text-zinc-500 hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-zinc-800">{c.text}</p>
                          {(isManager || c.userId === user?.userId) && (
                            <div className="flex shrink-0 gap-2">
                              <button
                                onClick={() => { setEditingCommentId(c.commentId); setEditingCommentText(c.text); }}
                                className="text-xs font-medium text-blue-600 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteComment(c.commentId)}
                                disabled={deletingCommentId === c.commentId}
                                className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                              >
                                {deletingCommentId === c.commentId ? "…" : "Delete"}
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">
                          {new Date(c.createdAt).toLocaleString()}
                        </p>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={handleAddComment} className="mt-3 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment…"
                className={inputClassInline}
              />
              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
