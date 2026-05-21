"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import * as api from "@/lib/api";
import type { Comment, Task } from "@/lib/types";
import { STATUS_COLUMNS } from "@/lib/types";
import { inputClassInline } from "@/lib/styles";

interface TaskDetailModalProps {
  task: Task | null;
  token: string;
  onClose: () => void;
  onUpdated: (task: Task) => void;
}

export function TaskDetailModal({
  task,
  token,
  onClose,
  onUpdated,
}: TaskDetailModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(task);

  useEffect(() => {
    setCurrentTask(task);
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
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 p-5">
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
                <p className="truncate font-medium">{currentTask.assigneeId}</p>
              </div>
            )}
          </div>

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
                    <p className="text-zinc-800">{c.text}</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {new Date(c.createdAt).toLocaleString()}
                    </p>
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
