"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { emailTemplateApi } from "@/lib/api/services";
import { EmailTemplate } from "@/types";
import { toast } from "sonner";
import { Plus, Copy, Trash2, Eye } from "lucide-react";
import { CreateTemplateDialog } from "@/components/emails/create-template-dialog";
import { ViewTemplateDialog } from "@/components/emails/view-template-dialog";

export default function EmailTemplatesPage() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewTemplate, setViewTemplate] = useState<EmailTemplate | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const response = await emailTemplateApi.getAll();
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => emailTemplateApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete template");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      emailTemplateApi.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template updated successfully");
    },
    onError: () => {
      toast.error("Failed to update template");
    },
  });

  const handleCopyTemplate = (template: EmailTemplate) => {
    navigator.clipboard.writeText(template.body);
    toast.success("Template body copied to clipboard");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email Templates</h1>
            <p className="text-muted-foreground mt-2">
              Manage your email templates for influencer outreach
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="text-center py-8">Loading templates...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates?.map((template: EmailTemplate) => (
              <Card
                key={template.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={template.isActive}
                          onCheckedChange={(checked: boolean) =>
                            toggleActiveMutation.mutate({
                              id: template.id,
                              isActive: checked,
                            })
                          }
                        />
                        <Badge
                          className={
                            template.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      Subject:
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {template.subject}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      Variables:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable) => (
                        <Badge
                          key={variable}
                          variant="outline"
                          className="text-xs"
                        >
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      Preview:
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {template.body.substring(0, 150)}...
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setViewTemplate(template)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleCopyTemplate(template)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(template.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {templates?.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                No email templates found. Create your first template to get
                started.
              </div>
            </CardContent>
          </Card>
        )}

        <CreateTemplateDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />

        <ViewTemplateDialog
          template={viewTemplate}
          onOpenChange={() => setViewTemplate(null)}
        />
      </div>
    </DashboardLayout>
  );
}
