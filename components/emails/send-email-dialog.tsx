"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
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

  const { data: templates } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const response = await emailTemplateApi.getAll();
      return response.data;
    },
  });

  const sendMutation = useMutation({
    mutationFn: (data: SendEmailData) => emailApi.send(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["influencer", influencer.id],
      });
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      toast.success("Email sent successfully");
      onOpenChange(false);
      setFormData({ templateId: "", subject: "", body: "" });
    },
    onError: () => {
      toast.error("Failed to send email");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject || !formData.body) {
      toast.error("Subject and body are required");
      return;
    }

    sendMutation.mutate({
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Email to {influencer.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email Template</label>
            <Select
              value={formData.templateId}
              onValueChange={handleTemplateChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template (optional)" />
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
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sendMutation.isPending}>
              {sendMutation.isPending ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
