import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CheckCircle2, Copy, Stethoscope, MessageSquare } from "lucide-react";

interface Props {
  copied: boolean;
  onCopy: () => void;
}

const InvitePanel: React.FC<Props> = ({ copied, onCopy }) => (
  <Card className="max-w-xl mx-auto">
    <CardHeader>
      <CardTitle>Generate Invite Link</CardTitle>
      <CardDescription>
        Create a shareable link to invite someone to practice
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-md flex items-center justify-between">
        <span className="text-gray-700 text-sm overflow-hidden overflow-ellipsis">
          https://ophthalmoprep.com/invite/ABC123
        </span>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onCopy}
          className="flex-shrink-0"
        >
          {copied ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div>
        <h3 className="font-medium mb-2">Session Options:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <Button className="justify-start" variant="outline">
            <Stethoscope className="h-5 w-5 mr-2" />
            Clinical Station
          </Button>
          <Button className="justify-start" variant="outline">
            <MessageSquare className="h-5 w-5 mr-2" />
            Communication Station
          </Button>
        </div>
        <Button className="w-full bg-primary">
          Generate New Session Link
        </Button>
      </div>
      <div className="border-t pt-4">
        <h3 className="font-medium mb-2">How it works:</h3>
        <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
          <li>Generate a link and share it with your practice partner</li>
          <li>They can join immediately when ready</li>
          <li>Both select your roles (Candidate or Actor)</li>
          <li>Complete the station with AI feedback</li>
        </ol>
      </div>
    </CardContent>
  </Card>
);

export default InvitePanel;
