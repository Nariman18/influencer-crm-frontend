"use client";

import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosResponse } from "axios";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { emailApi, emailTemplateApi } from "@/lib/api/services";
import {
  ApiError,
  EmailTemplate,
  Influencer,
  BulkOperationResult,
} from "@/types";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { X, Mail, Loader2, ChevronsUpDown } from "lucide-react";

interface BulkSendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInfluencers: Influencer[];
  onSelectionClear: () => void;
}

type BulkSendPayload = {
  influencerIds: string[];
  templateId: string;
  variables?: Record<string, string>;
  startAutomation?: boolean;
  automationTemplates?: string[];
  provider?: "gmail" | "mailgun";
};

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [startAutomation, setStartAutomation] = useState(false);

  /**
   * automationTemplates is an ARRAY of template **names** in the order the user selected them.
   * We keep names here because the backend / API expects an array of template names for sequencing.
   */
  const [automationTemplates, setAutomationTemplates] = useState<string[]>([]);

  // Fetch templates
  const {
    data: templates,
    isLoading: templatesLoading,
    isError: templatesError,
  } = useQuery<EmailTemplate[], Error>({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const resp = await emailTemplateApi.getAll();
      return resp.data;
    },
  });

  // Quick lookup maps
  const templatesById = useMemo(() => {
    const m = new Map<string, EmailTemplate>();
    templates?.forEach((t) => m.set(t.id, t));
    return m;
  }, [templates]);

  const templatesByName = useMemo(() => {
    const m = new Map<string, EmailTemplate>();
    templates?.forEach((t) => m.set(t.name, t));
    return m;
  }, [templates]);

  const bulkSendMutation = useMutation<
    AxiosResponse<BulkOperationResult>,
    ApiError,
    BulkSendPayload
  >({
    mutationFn: (data: BulkSendPayload) => emailApi.bulkSend(data),
    onSuccess: (result) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["influencers"] });
        queryClient.invalidateQueries({ queryKey: ["emails"] });
      }, 0);

      const successCount = result.data?.success ?? 0;
      const failedCount = result.data?.failed ?? 0;

      toast.success(
        `✅ Queued ${successCount} emails for sending${
          failedCount > 0 ? `, ${failedCount} failed` : ""
        }`
      );

      // Reset form + close
      setIsProcessing(false);
      onOpenChange(false);
      onSelectionClear();
      setFormData({ templateId: "", subject: "", body: "" });
      setStartAutomation(false);
      setAutomationTemplates([]);
    },
    onError: (error: ApiError) => {
      setIsProcessing(false);
      toast.error(
        error.response?.data?.message || "Failed to queue bulk emails"
      );
    },
  });

  const handleTemplateChange = (templateId: string) => {
    const template = templatesById.get(templateId);
    if (template) {
      setFormData({
        templateId,
        subject: template.subject,
        body: template.body,
      });
    } else {
      // clear primary template fields if id blank
      setFormData((prev) => ({ ...prev, templateId }));
    }

    // Reset automation selection when primary changes — avoids accidental duplicates
    setAutomationTemplates((prev) =>
      prev.filter((n) => !!templatesByName.get(n))
    );
  };

  /**
   * Toggle a template in the ordered automationTemplates list.
   * If not present -> append to the end (this determines sequence).
   * If present -> remove it.
   */
  const toggleAutomationTemplateByName = (name: string) => {
    setAutomationTemplates((prev) => {
      if (prev.includes(name)) {
        return prev.filter((p) => p !== name);
      }
      // append at end to represent sequence order
      return [...prev, name];
    });
  };

  /**
   * Remove by index (useful for "remove" action on preview badges).
   */
  const removeAutomationAtIndex = (index: number) => {
    setAutomationTemplates((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      .filter((influencer) => influencer.email)
      .map((influencer) => influencer.id);

    if (influencerIds.length === 0) {
      toast.error("No selected influencers have email addresses");
      return;
    }

    setIsProcessing(true);
    toast.info(`Sending ${influencerIds.length} emails...`);

    try {
      await bulkSendMutation.mutateAsync({
        influencerIds,
        templateId: formData.templateId,
        variables: {
          name: "{{name}}",
          email: "{{email}}",
          instagramHandle: "{{instagramHandle}}",
        },
        startAutomation,
        automationTemplates: startAutomation ? automationTemplates : [],
      });
    } catch (err) {
      // mutateAsync rejection will be handled by onError; ensure local state
      console.error("Bulk send error:", err);
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setIsProcessing(false);
    onOpenChange(false);
    onSelectionClear();
    setFormData({ templateId: "", subject: "", body: "" });
    setStartAutomation(false);
    setAutomationTemplates([]);
  };

  const influencersWithEmail = selectedInfluencers.filter(
    (influencer) => influencer.email
  );
  const influencersWithoutEmail = selectedInfluencers.filter(
    (influencer) => !influencer.email
  );

  return (
    <Dialog open={open} onOpenChange={(val) => val === false && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <DialogTitle className="flex items-center gap-3">
                <Mail className="h-5 w-5" />
                <span>Bulk Send Email</span>
                {isProcessing && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </DialogTitle>
            </div>

            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleClose();
                }}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 p-4">
          {/* Selected influencers summary */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Selected influencers</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={onSelectionClear}
                disabled={isProcessing}
              >
                Clear
              </Button>
            </div>

            <div className="border rounded-lg p-3 max-h-28 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {selectedInfluencers.map((inf) => (
                  <Badge
                    key={inf.id}
                    variant={inf.email ? "default" : "secondary"}
                    className={`px-2 py-1 text-sm ${
                      inf.email ? "bg-primary" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {inf.name}
                    {!inf.email && " (no email)"}
                  </Badge>
                ))}
              </div>
              {influencersWithoutEmail.length > 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  ⚠️ {influencersWithoutEmail.length} influencer(s) missing
                  email — they&apos;ll be skipped.
                </p>
              )}
            </div>
          </section>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Template select */}
            <div className="grid grid-cols-1 gap-2">
              <Label className="text-sm">Email Template *</Label>
              <Select
                value={formData.templateId}
                onValueChange={handleTemplateChange}
                disabled={isProcessing || templatesLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      templatesLoading
                        ? "Loading templates..."
                        : "Choose a template"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {templates && templates.length > 0 ? (
                    templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__none__" disabled>
                      {templatesLoading ? "Loading..." : "No templates"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="grid grid-cols-1 gap-2">
              <Label className="text-sm">Subject *</Label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subject: e.target.value }))
                }
                placeholder="Email subject"
                className="w-full px-3 py-2 rounded-md border text-sm outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                required
                disabled={isProcessing}
              />
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 gap-2">
              <Label className="text-sm">Body *</Label>
              <Textarea
                value={formData.body}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, body: e.target.value }))
                }
                placeholder="Email body — use {{name}}, {{email}}, {{instagramHandle}}"
                rows={10}
                required
                disabled={isProcessing}
              />
            </div>

            {/* Automation toggle + multi-select for follow-ups */}
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={startAutomation}
                    onCheckedChange={(val) => {
                      const enabled = !!val;
                      setStartAutomation(enabled);
                      if (!enabled) setAutomationTemplates([]);
                    }}
                    disabled={isProcessing}
                  />

                  <div className="text-sm font-medium">Start automation</div>
                </div>

                <div className="text-sm text-muted-foreground">
                  {startAutomation
                    ? `${automationTemplates.length} follow-up templates selected`
                    : "Automation off"}
                </div>
              </div>

              {/* Multi-select dropdown for automation templates (compact) */}
              {startAutomation && (
                <div className="space-y-2">
                  <Label className="text-sm">Follow-up templates</Label>

                  <Select
                    value={automationTemplates.join("|")}
                    onValueChange={(val) => {
                      if (!val) return;
                      toggleAutomationTemplateByName(val);
                    }}
                    disabled={isProcessing || templatesLoading}
                  >
                    <SelectTrigger className="w-full">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Select follow-up templates" />
                        </div>
                      </div>
                    </SelectTrigger>

                    <SelectContent>
                      {templates && templates.length > 0 ? (
                        templates.map((t) => (
                          <SelectItem key={t.id} value={t.name}>
                            <div className="flex items-center justify-between w-full">
                              <div className="truncate">{t.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {t.subject}
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="__none__" disabled>
                          {templatesLoading ? "Loading..." : "No templates"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>

                  {/* Sequence preview: clear numbered badges that show the final sequence & allow removing */}
                  <div>
                    <Label className="text-sm">Selected sequence</Label>
                    {automationTemplates.length === 0 ? (
                      <div className="text-xs text-muted-foreground mt-1 text-yellow-600">
                        No follow-up templates selected yet. Use the dropdown
                        above to add templates to the sequence.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {automationTemplates.map((name, idx) => (
                          <div
                            key={`${name}-${idx}`}
                            className="inline-flex items-center gap-2 px-2 py-1 rounded-md border bg-muted/30"
                          >
                            <span className="text-xs px-1 py-0.5 rounded bg-primary text-white font-medium">
                              {idx + 1}
                            </span>
                            <span className="text-sm">{name}</span>
                            <button
                              type="button"
                              onClick={() => removeAutomationAtIndex(idx)}
                              className="ml-2 text-xs text-red-600 hover:underline"
                              aria-label={`Remove ${name} from sequence`}
                              disabled={isProcessing}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      The order above is the sequence that will be sent after
                      the primary email.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Personalization help */}
            <div className="text-xs text-muted-foreground p-3 bg-muted rounded-md">
              <div className="font-medium mb-1">Personalization variables</div>
              <div>
                Use{" "}
                <code className="rounded px-1 py-0.5 bg-muted-foreground/5 border">
                  {"{{name}}"}
                </code>
                ,{" "}
                <code className="rounded px-1 py-0.5 bg-muted-foreground/5 border">
                  {"{{email}}"}
                </code>
                ,{" "}
                <code className="rounded px-1 py-0.5 bg-muted-foreground/5 border">
                  {"{{instagramHandle}}"}
                </code>{" "}
                in subject & body.
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => handleClose()}
                disabled={isProcessing}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isProcessing || influencersWithEmail.length === 0}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>Send {influencersWithEmail.length} Emails</>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BulkSendEmailDialog;
