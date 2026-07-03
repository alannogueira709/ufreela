"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Link as LinkIcon,
  Unlink,
  RefreshCw,
  ExternalLink,
  GraduationCap,
  Briefcase,
  FolderGit,
  Star,
  GitFork,
  CheckCircle2,
} from "lucide-react";
import { integrationsApi, type ImportedEducation, type ImportedExperience, type PortfolioProject, type LinkedInConnection, type GitHubConnection } from "@/lib/settings-api";

interface DataState {
  connections: {
    linkedin: LinkedInConnection | null;
    github: GitHubConnection | null;
  };
  education: ImportedEducation[];
  experience: ImportedExperience[];
  portfolio: PortfolioProject[];
}

export function IntegrationsTab() {
  const [data, setData] = useState<DataState | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await integrationsApi.getData();
      setData(res);
    } catch {
      toast.error("Erro ao carregar integrações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const connectLinkedIn = () => {
    const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/linkedin/callback`;
    const state = btoa(JSON.stringify({ source: "settings" }));
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId!,
      redirect_uri: redirectUri,
      state,
      scope: "r_profile_basicinfo r_most_recent_education r_primary_current_experience",
    });
    window.location.href = `https://www.linkedin.com/oauth/v2/authorization?${params}`;
  };

  const connectGitHub = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const state = btoa(JSON.stringify({ source: "settings" }));
    const params = new URLSearchParams({
      client_id: clientId!,
      redirect_uri: redirectUri,
      scope: "read:user repo",
      state,
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params}`;
  };

  const handleSync = async (provider: "github" | "linkedin") => {
    setSyncing(provider);
    try {
      if (provider === "github") {
        await integrationsApi.syncGitHub();
      }
      toast.success("Sincronizado com sucesso!");
      fetchData();
    } catch {
      toast.error("Erro na sincronização");
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnect = async (provider: "github" | "linkedin") => {
    try {
      if (provider === "linkedin") await integrationsApi.disconnectLinkedIn();
      else await integrationsApi.disconnectGitHub();
      toast.success("Desconectado");
      fetchData();
    } catch {
      toast.error("Erro ao desconectar");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const linkedin = data?.connections?.linkedin;
  const github = data?.connections?.github;

  return (
    <div className="space-y-6">
      {/* LinkedIn */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center">
                <LinkIcon className="h-5 w-5 text-[#0A66C2]" />
              </div>
              <div>
                <CardTitle className="text-base">LinkedIn</CardTitle>
                <p className="text-xs text-muted-foreground">Educação e experiência profissional</p>
              </div>
            </div>
            {linkedin?.is_active ? (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Conectado
              </Badge>
            ) : (
              <Badge variant="secondary">Não conectado</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {linkedin?.is_active ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{linkedin.headline || "Perfil LinkedIn"}</p>
                  {linkedin.profile_url && (
                    <a href={linkedin.profile_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1 mt-0.5 hover:underline">
                      <ExternalLink className="h-3 w-3" /> Ver perfil
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleSync("linkedin")} disabled={syncing === "linkedin"}>
                    <RefreshCw className={`h-4 w-4 mr-1.5 ${syncing === "linkedin" ? "animate-spin" : ""}`} />
                    Sincronizar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDisconnect("linkedin")} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Unlink className="h-4 w-4 mr-1.5" /> Desconectar
                  </Button>
                </div>
              </div>

              {data!.education.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <GraduationCap className="h-4 w-4 text-slate-500" />
                    Educação ({data!.education.length})
                  </h4>
                  <div className="space-y-2">
                    {data!.education.slice(0, 3).map((edu) => (
                      <div key={edu.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className="h-8 w-8 rounded bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                          <GraduationCap className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{edu.institution}</p>
                          <p className="text-xs text-muted-foreground">
                            {edu.degree}{edu.field_of_study ? ` • ${edu.field_of_study}` : ""}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{edu.source}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data!.experience.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Briefcase className="h-4 w-4 text-slate-500" />
                    Experiência ({data!.experience.length})
                  </h4>
                  <div className="space-y-2">
                    {data!.experience.slice(0, 3).map((exp) => (
                      <div key={exp.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className="h-8 w-8 rounded bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center shrink-0">
                          <Briefcase className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{exp.title}</p>
                          <p className="text-xs text-muted-foreground">{exp.company}</p>
                        </div>
                        {exp.is_current && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Atual</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <LinkIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Importe automaticamente sua formação acadêmica e experiência do LinkedIn.
              </p>
              <Button onClick={connectLinkedIn} className="bg-[#0A66C2] hover:bg-[#0842a0]">
                <LinkIcon className="h-4 w-4 mr-2" /> Conectar LinkedIn
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GitHub */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-900 dark:bg-slate-800 flex items-center justify-center">
                <FolderGit className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">GitHub</CardTitle>
                <p className="text-xs text-muted-foreground">Repositórios para portfólio</p>
              </div>
            </div>
            {github?.is_active ? (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Conectado
              </Badge>
            ) : (
              <Badge variant="secondary">Não conectado</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {github?.is_active ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div className="flex items-center gap-3">
                  {github.avatar_url && (
                    <Image
                      src={github.avatar_url}
                      alt=""
                      width={40}
                      height={40}
                      unoptimized
                      className="h-10 w-10 rounded-full"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium">@{github.username}</p>
                    <p className="text-xs text-muted-foreground">{github.repos_fetched} repositórios importados</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleSync("github")} disabled={syncing === "github"}>
                    <RefreshCw className={`h-4 w-4 mr-1.5 ${syncing === "github" ? "animate-spin" : ""}`} />
                    Sincronizar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDisconnect("github")} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Unlink className="h-4 w-4 mr-1.5" /> Desconectar
                  </Button>
                </div>
              </div>

              {data!.portfolio.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <FolderGit className="h-4 w-4 text-slate-500" />
                    Projetos ({data!.portfolio.length})
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {data!.portfolio.slice(0, 4).map((project) => (
                      <div key={project.id} className="p-3 rounded-lg border hover:border-slate-300 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-medium truncate pr-2">{project.title}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                            <span className="flex items-center gap-0.5"><Star className="h-3 w-3" /> {project.stars}</span>
                            <span className="flex items-center gap-0.5"><GitFork className="h-3 w-3" /> {project.forks}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{project.description || "Sem descrição"}</p>
                        <div className="flex flex-wrap gap-1">
                          {project.technologies.slice(0, 3).map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                          ))}
                          {project.technologies.length > 3 && (
                            <Badge variant="secondary" className="text-[10px]">+{project.technologies.length - 3}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <FolderGit className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Importe seus repositórios GitHub como projetos de portfólio.
              </p>
              <Button onClick={connectGitHub} className="bg-slate-900 hover:bg-slate-800">
                <LinkIcon className="h-4 w-4 mr-2" /> Conectar GitHub
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
