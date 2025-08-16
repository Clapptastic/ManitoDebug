
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useCodeFiles = () => {
  const [isLoading, setIsLoading] = useState(false);

  const uploadCodeFile = async (file: File) => {
    try {
      setIsLoading(true);
      console.log('Starting file upload process for:', file.name);
      
      if (!file) {
        throw new Error('No file selected');
      }

      // Validate file type
      const allowedExtensions = ['.js','.jsx','.ts','.tsx','.py','.java','.cpp','.cs','.rb','.php','.go','.rs','.swift','.kt','.dart','.sol'];
      const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
      
      console.log('File extension:', fileExt);
      if (!allowedExtensions.includes(fileExt)) {
        throw new Error('Invalid file type. Please upload a code file.');
      }

      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      // Read the file content
      const fileContent = await file.text();
      console.log('File content read, processing embedding');

      // Call the GitHub code embed function with manual mode
      const { data, error } = await supabase.functions.invoke('github-code-embed', {
        body: {
          type: 'manual',
          content: {
            filePath: file.name,
            fileContent: fileContent
          }
        }
      });

      if (error) {
        console.error('Error processing code embedding:', error);
        throw error;
      }

      console.log('File processed successfully:', data);

      toast({
        title: "File uploaded successfully",
        description: "Your code file has been uploaded and processed for embeddings."
      });

      return data;
    } catch (error: any) {
      console.error('Error uploading code file:', error);
      toast({
        title: "Error uploading file",
        description: error.message || "There was an error uploading your file",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    uploadCodeFile,
    isLoading
  };
};
