import { Button } from "./button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface CopyButtonProps {
  text: string;
  onCopy?: () => void;
}

export function CopyButton({ text, onCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        description: "Copied to clipboard!",
      });
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        description: "Failed to copy text",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleCopy}
      className="h-8 w-8"
    >
      {copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}
