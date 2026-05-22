"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import * as api from "@/lib/api";
import type { Comment, Task } from "@/lib/types";
import { STATUS_COLUMNS } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Calendar, User, Paperclip, MessageSquare, Pencil, Trash2, Loader2, Send, Upload } from "lucide-react";

interface TaskDetailModalProps {
  task: Task | null;
  token: string;
  onClose: () => void;
  onUpdated: (task: Task) => void;
  onDeleted?: (taskId: string) => void;
}

const priorityBadge: Record<string, string> = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const statusBadge: Record<string, string> = {
  ToDo: "bg-slate-100 text-slate-700",
  InProgress: "bg-blue-100 text-blue-700",
  InReview: "bg-violet-100 text-violet-700",
  Done: "bg-emerald-100 text-emerald-700",
};

export function TaskDetailModal({ task, token, onClose, onUpdated, onDeleted }: TaskDetailModalProps) {
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
    if (task) loadComments();
    else { setComments([]); setCommentText(""); }
  }, [task, loadComments]);

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editTitle.trim()) return;
    setSavingEdit(true);
    try {
      let assigneeId: string | undefined = currentTask!.assigneeId;
      let assigneeUsername: string | undefined = currentTask!.assigneeUsername;
      if (editAssigneeUsername.trim()) {
        const u = await api.lookupUser(token, editAssigneeUsername.trim());
        assigneeId = u.userId;
        assigneeUsername = editAssigneeUsername.trim();
      }
      const updated = await api.updateTask(token, task!.taskId, {
        title: editTitle, description: editDescription || undefined,
        priority: editPriority, deadline: editDeadline || undefined,
        assigneeId, assigneeUsername,
      });
      setCurrentTask(updated); onUpdated(updated); setEditing(false);
      toast.success("Task updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update task");
    } finally { setSavingEdit(false); }
  }

  async function handleDelete() {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.deleteTask(token, task!.taskId);
      toast.success("Task deleted"); onDeleted?.(task!.taskId); onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete task");
    } finally { setDeleting(false); }
  }

  async function handleAddComment(e: FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await api.addComment(token, task!.taskId, commentText.trim());
      setCommentText(""); await loadComments(); toast.success("Comment added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add comment");
    } finally { setSubmitting(false); }
  }

  async function handleSaveComment(commentId: string) {
    if (!editingCommentText.trim()) return;
    setSavingComment(true);
    try {
      const updated = await api.updateComment(token, task!.taskId, commentId, editingCommentText.trim());
      setComments((prev) => prev.map((c) => (c.commentId === commentId ? updated : c)));
      setEditingCommentId(null); toast.success("Comment updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update comment");
    } finally { setSavingComment(false); }
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
    } finally { setDeletingCommentId(null); }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { uploadUrl } = await api.getUploadUrl(token, task!.taskId);
      await api.uploadFile(uploadUrl, file);
      const updated = await api.getTask(token, task!.taskId);
      setCurrentTask(updated); onUpdated(updated); toast.success("File uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally { setUploading(false); e.target.value = ""; }
  }

  const statusLabel = STATUS_COLUMNS.find((c) => c.id === currentTask?.status)?.label || currentTask?.status;
  const canEdit = isManager || currentTask?.assigneeId === user?.userId;

  return (
    <Dialog open={!!task} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold leading-tight pr-2">
                {currentTask?.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[currentTask?.status ?? "ToDo"]}`}>
                  {statusLabel}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${priorityBadge[currentTask?.priority ?? "Medium"]}`}>
                  {currentTask?.priority}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!editing && canEdit && (
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-8 gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
              )}
              {!editing && isManager && (
                <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleting} className="h-8 gap-1.5 text-destructive hover:text-destructive">
                  {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          <div className="space-y-5 px-6 py-5">
            {editing ? (
              <form onSubmit={handleSaveEdit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} className="resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select value={editPriority} onValueChange={(v) => setEditPriority(v ?? "Medium")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">🔴 High</SelectItem>
                        <SelectItem value="Medium">🟡 Medium</SelectItem>
                        <SelectItem value="Low">🟢 Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Deadline</Label>
                    <Input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Assignee username</Label>
                  <Input
                    value={editAssigneeUsername}
                    onChange={(e) => setEditAssigneeUsername(e.target.value)}
                    placeholder={currentTask?.assigneeId ? "Leave blank to keep current" : "Username"}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={savingEdit} className="flex-1">
                    {savingEdit ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save Changes"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {currentTask?.description && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Description</p>
                    <p className="text-sm text-foreground">{currentTask.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {currentTask?.deadline && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Deadline</p>
                        <p className="font-medium">{new Date(currentTask.deadline).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  {currentTask?.assigneeId && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Assignee</p>
                        <p className="font-medium truncate">{currentTask.assigneeUsername ?? currentTask.assigneeId}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attachments</p>
              </div>
              {currentTask?.attachments && currentTask.attachments.length > 0 ? (
                <ul className="space-y-1 mb-2">
                  {currentTask.attachments.map((key) => (
                    <li key={key} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5">
                      <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate text-xs text-foreground">{key.split("/").pop()}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground mb-2">No attachments</p>
              )}
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="h-4 w-4" /> Upload file</>}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comments</p>
              </div>
              {loadingComments ? (
                <div className="space-y-2">
                  {[1,2].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}
                </div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet</p>
              ) : (
                <ul className="space-y-2 mb-3">
                  {comments.map((c) => (
                    <li key={c.commentId} className="rounded-lg bg-muted/40 p-3">
                      {editingCommentId === c.commentId ? (
                        <div className="space-y-2">
                          <Input value={editingCommentText} onChange={(e) => setEditingCommentText(e.target.value)} autoFocus className="h-8 text-sm" />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveComment(c.commentId)} disabled={savingComment} className="h-7 text-xs">
                              {savingComment ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)} className="h-7 text-xs">Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-foreground">{c.text}</p>
                            {(isManager || c.userId === user?.userId) && (
                              <div className="flex shrink-0 gap-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingCommentId(c.commentId); setEditingCommentText(c.text); }}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleDeleteComment(c.commentId)} disabled={deletingCommentId === c.commentId}>
                                  {deletingCommentId === c.commentId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                </Button>
                              </div>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</p>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment…" className="flex-1" />
                <Button type="submit" size="icon" disabled={submitting || !commentText.trim()}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
