"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { EmailTemplate } from "@/types";

interface ViewTemplateDialogProps {
  template: EmailTemplate | null;
  onOpenChange: (open: boolean) => void;
}

export function ViewTemplateDialog({
  template,
  onOpenChange,
}: ViewTemplateDialogProps) {
  if (!template) return null;

  return (
    <Dialog open={!!template} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Subject:</h4>
            <p className="text-lg border rounded-md p-3 bg-gray-50">
              {template.subject}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Available Variables:
            </h4>
            <div className="flex flex-wrap gap-2">
              {template.variables.map((variable) => (
                <Badge key={variable} variant="secondary">
                  {`{{${variable}}}`}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Email Body:
            </h4>
            <div className="border rounded-md p-4 bg-gray-50 whitespace-pre-wrap">
              {template.body}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Created: {new Date(template.createdAt).toLocaleDateString()}</p>
            <p>Updated: {new Date(template.updatedAt).toLocaleDateString()}</p>
            <p>Status: {template.isActive ? "Active" : "Inactive"}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
