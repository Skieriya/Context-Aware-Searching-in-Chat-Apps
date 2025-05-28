
import { readChatLog } from '@/lib/chat-storage';
import { CHAT_ID } from '@/config/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function ViewLogPage() {
  const logEntries = await readChatLog(CHAT_ID);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Chat Log Viewer</CardTitle>
              <CardDescription>Contents of <code>chat_logs/{CHAT_ID}/log.json</code></CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Chat
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logEntries.length > 0 ? (
            <pre className="p-4 bg-muted rounded-md text-sm overflow-auto max-h-[70vh]">
              {JSON.stringify(logEntries, null, 2)}
            </pre>
          ) : (
            <p className="text-muted-foreground">The log file is empty or could not be read.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
