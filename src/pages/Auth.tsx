import { appUrl } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Activity } from "lucide-react";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/hooks/useAuth";

export default function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/journal", { replace: true });
    });
  }, [navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate("/journal", { replace: true });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: appUrl("/journal"), data: { display_name: name } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — you can sign in now.");
  };

  const signInDemo = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate("/journal", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Pulse Journal</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Your private, AI-assisted health journal.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={signIn} className="space-y-3 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="e1">Email</Label>
                    <Input id="e1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p1">Password</Label>
                    <Input id="p1" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={signUp} className="space-y-3 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="n">Name</Label>
                    <Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="e2">Email</Label>
                    <Input id="e2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p2">Password</Label>
                    <Input id="p2" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating…" : "Create account"}</Button>
                </form>
              </TabsContent>
            </Tabs>
            <div className="mt-4 border-t pt-4">
              <Button variant="outline" className="w-full" onClick={signInDemo} disabled={loading}>
                Explore the demo account
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                A sample journal with real entries, medications and vitals.
              </p>
            </div>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Pulse is a personal journal and does not provide medical advice.
        </p>
      </div>
    </div>
  );
}
