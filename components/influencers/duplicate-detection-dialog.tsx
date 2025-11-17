"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, User, Mail, Instagram } from "lucide-react";
import Link from "next/link";
import { DuplicateInfluencer } from "@/types";
import { InfluencerStatus } from "@/lib/shared-types";

interface DuplicateDetectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicate: DuplicateInfluencer | null; // Allow null
  onContinue: () => void;
  onCancel: () => void;
  type: "email" | "instagram" | "both";
}

const statusColors: Record<InfluencerStatus, string> = {
  [InfluencerStatus.NOT_SENT]: "bg-gray-100 text-gray-800",
  [InfluencerStatus.PING_1]: "bg-blue-100 text-blue-800",
  [InfluencerStatus.PING_2]: "bg-yellow-100 text-yellow-800",
  [InfluencerStatus.PING_3]: "bg-orange-100 text-orange-800",
  [InfluencerStatus.CONTRACT]: "bg-green-100 text-green-800",
  [InfluencerStatus.REJECTED]: "bg-red-100 text-red-800",
  [InfluencerStatus.COMPLETED]: "bg-purple-100 text-purple-800",
};

export function DuplicateDetectionDialog({
  open,
  onOpenChange,
  duplicate,
  onContinue,
  onCancel,
  type,
}: DuplicateDetectionDialogProps) {
  // Early return if no duplicate (shouldn't happen when dialog is open, but for safety)
  if (!duplicate) {
    return null;
  }

  const getTitle = () => {
    switch (type) {
      case "email":
        return "Duplicate Email Found";
      case "instagram":
        return "Duplicate Instagram Handle Found";
      case "both":
        return "Duplicate Influencer Found";
      default:
        return "Duplicate Found";
    }
  };

  const getDescription = () => {
    switch (type) {
      case "email":
        return `An influencer with the email ${duplicate.email} already exists in your database.`;
      case "instagram":
        return `An influencer with the Instagram handle @${duplicate.instagramHandle} already exists in your database.`;
      case "both":
        return `An influencer with both the email ${duplicate.email} and Instagram handle @${duplicate.instagramHandle} already exists in your database.`;
      default:
        return "A duplicate influencer was found in your database.";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>{getTitle()}</DialogTitle>
          </div>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Existing Influencer</span>
              </div>
              <Badge className={statusColors[duplicate.status]}>
                {duplicate.status.replace("_", " ")}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Name:</span>
                <span>{duplicate.name}</span>
              </div>

              {duplicate.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{duplicate.email}</span>
                </div>
              )}

              {duplicate.instagramHandle && (
                <div className="flex items-center space-x-2">
                  <Instagram className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">Instagram:</span>
                  <span>@{duplicate.instagramHandle}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Continuing will create a duplicate entry.
              Consider updating the existing influencer instead.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel} className="sm:flex-1">
            Cancel
          </Button>
          <div className="flex gap-2 sm:flex-1">
            <Link href={`/influencers/${duplicate.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                View Existing
              </Button>
            </Link>
            <Button
              onClick={onContinue}
              variant="destructive"
              className="flex-1"
            >
              Continue Anyway
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
