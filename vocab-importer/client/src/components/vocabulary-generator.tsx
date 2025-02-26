import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { VocabGenerationRequest, VocabGenerationResponse, vocabGenerationRequestSchema, themeOptions } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function VocabularyGenerator() {
  const [result, setResult] = useState<VocabGenerationResponse>();
  const { toast } = useToast();

  const form = useForm<VocabGenerationRequest>({
    resolver: zodResolver(vocabGenerationRequestSchema),
    defaultValues: {
      theme: undefined,
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: VocabGenerationRequest) => {
      const res = await apiRequest("POST", "/api/generate", data);
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate vocabulary",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VocabGenerationRequest) => {
    generateMutation.mutate(data);
  };

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
        Japanese Vocabulary Generator
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="theme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select a Theme</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a theme for vocabulary" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {themeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            className="w-full"
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? "Generating..." : "Generate Vocabulary"}
          </Button>
        </form>
      </Form>

      {generateMutation.isPending && (
        <div className="mt-8 space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {result && (
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Generated Vocabulary</h2>
              <CopyButton text={JSON.stringify(result, null, 2)} />
            </div>
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}