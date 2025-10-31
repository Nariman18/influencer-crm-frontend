"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { emailApi, emailTemplateApi } from "@/lib/api/services";
import { ApiError, EmailTemplate, Influencer } from "@/types";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { X, Users, Mail } from "lucide-react";

interface BulkSendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInfluencers: Influencer[];
  onSelectionClear: () => void;
}

export function BulkSendEmailDialog({
  open,
  onOpenChange,
  selectedInfluencers,
  onSelectionClear,
}: BulkSendEmailDialogProps) {
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

  const bulkSendMutation = useMutation({
    mutationFn: (data: {
      influencerIds: string[];
      templateId: string;
      variables?: Record<string, string>;
    }) => emailApi.bulkSend(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["influencers"] });
      queryClient.invalidateQueries({ queryKey: ["emails"] });

      toast.success(
        `Queued ${result.data.success} emails for sending${
          result.data.failed > 0 ? `, ${result.data.failed} failed` : ""
        }`
      );

      onOpenChange(false);
      onSelectionClear();
      setFormData({ templateId: "", subject: "", body: "" });
    },
    onError: (error: ApiError) => {
      toast.error(
        error.response?.data?.message || "Failed to queue bulk emails"
      );
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

    if (!formData.templateId) {
      toast.error("Please select an email template");
      return;
    }

    if (!formData.subject || !formData.body) {
      toast.error("Subject and body are required");
      return;
    }

    const influencerIds = selectedInfluencers
      .filter((influencer) => influencer.email) // Only include influencers with email
      .map((influencer) => influencer.id);

    if (influencerIds.length === 0) {
      toast.error("No selected influencers have email addresses");
      return;
    }

    bulkSendMutation.mutate({
      influencerIds,
      templateId: formData.templateId,
      variables: {
        // Global variables that will be personalized for each influencer
        name: "{{name}}",
        email: "{{email}}",
        instagramHandle: "{{instagramHandle}}",
      },
    });
  };

  const influencersWithEmail = selectedInfluencers.filter(
    (influencer) => influencer.email
  );
  const influencersWithoutEmail = selectedInfluencers.filter(
    (influencer) => !influencer.email
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Bulk Send Email
          </DialogTitle>
          <DialogDescription>
            Send the same email to {selectedInfluencers.length} selected
            influencers
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Selected Influencers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Selected Influencers</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSelectionClear}
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>

            <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {selectedInfluencers.map((influencer) => (
                  <Badge
                    key={influencer.id}
                    variant={influencer.email ? "default" : "secondary"}
                    className={
                      influencer.email
                        ? "bg-primary"
                        : "bg-gray-100 text-gray-600"
                    }
                  >
                    {influencer.name}
                    {!influencer.email && " (no email)"}
                  </Badge>
                ))}
              </div>
            </div>

            {influencersWithoutEmail.length > 0 && (
              <p className="text-sm text-amber-600">
                ⚠️ {influencersWithoutEmail.length} influencer(s) don&apos;t
                have email addresses and will be skipped
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email Template *</label>
              <Select
                value={formData.templateId}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
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
              <textarea
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                placeholder="Email subject"
                className="w-full px-3 py-2 border rounded-md text-sm resize-none"
                rows={2}
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
                rows={12}
                required
              />
            </div>

            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
              <p className="font-medium mb-1">
                Available Personalization Variables:
              </p>
              <p>
                Use {"{{name}}"}, {"{{email}}"}, {"{{instagramHandle}}"} to
                personalize each email
              </p>
              <p className="mt-1 text-xs">
                Example: &quot;Hi {"{{name}}"}, we noticed your great content on
                Instagram...&quot;
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  bulkSendMutation.isPending ||
                  influencersWithEmail.length === 0
                }
                className="min-w-32"
              >
                {bulkSendMutation.isPending ? (
                  <>Queueing {influencersWithEmail.length} emails...</>
                ) : (
                  <>Queue {influencersWithEmail.length} Emails</>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
