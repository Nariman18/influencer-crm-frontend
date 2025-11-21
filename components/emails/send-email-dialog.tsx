"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { emailApi, emailTemplateApi } from "@/lib/api/services";
import { Influencer, EmailTemplate, SendEmailData } from "@/types";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  influencer: Influencer;
}

export function SendEmailDialog({
  open,
  onOpenChange,
  influencer,
}: SendEmailDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    templateId: "",
    subject: "",
    body: "",
  });

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const response = await emailTemplateApi.getAll();
      return response.data;
    },
  });

  const sendMutation = useMutation({
    mutationFn: (data: SendEmailData) => emailApi.send(data),
    onSuccess: () => {
      // Non-blocking cache invalidation
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["influencer", influencer.id],
        });
        queryClient.invalidateQueries({ queryKey: ["emails"] });
      }, 100);

      toast.success("Email queued successfully");
      onOpenChange(false);
      setFormData({ templateId: "", subject: "", body: "" });
    },
    onError: () => {
      toast.error("Failed to queue email");
    },
  });

  const handleTemplateChange = (templateId: string) => {
    const template = templates?.find((t: EmailTemplate) => t.id === templateId);
    if (template) {
      setFormData({
        templateId,
        subject: template.subject,
        body: template.body,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject || !formData.body) {
      toast.error("Subject and body are required");
      return;
    }

    toast.info("Queueing email...");

    try {
      await sendMutation.mutateAsync({
        influencerId: influencer.id,
        templateId: formData.templateId || undefined,
        subject: formData.subject,
        body: formData.body,
        variables: {
          name: influencer.name,
          email: influencer.email || "",
          instagramHandle: influencer.instagramHandle || "",
        },
      });
    } catch (error) {
      // Error handled in mutation
      console.error("Send email error:", error);
    }
  };

  const isSubmitting = sendMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!isSubmitting) {
          onOpenChange(newOpen);
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Send Email to {influencer.name}
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          </DialogTitle>
          <DialogDescription>
            Compose and send an email to this influencer
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email Template</label>
            <Select
              value={formData.templateId}
              onValueChange={handleTemplateChange}
              disabled={isSubmitting || templatesLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    templatesLoading
                      ? "Loading templates..."
                      : "Select a template (optional)"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((template: EmailTemplate) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Subject *</label>
            <Input
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              placeholder="Email subject"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Body *</label>
            <Textarea
              value={formData.body}
              onChange={(e) =>
                setFormData({ ...formData, body: e.target.value })
              }
              placeholder="Email body"
              rows={10}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              Available variables: {"{{name}}"}, {"{{email}}"},{" "}
              {"{{instagramHandle}}"}
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Queueing...
                </>
              ) : (
                "Queue Email"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
