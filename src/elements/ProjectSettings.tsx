import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Minus, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/projectStore";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/store/settingsStore";

export default function ProjectSettings() {
  const { projects, addProject, updateProject, removeProject } =
    useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects?.[0]?.id
  );
  const { availableModels } = useSettingsStore();

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const onAddProject = async () => {
    const newIdx = projects.length;
    await addProject({
      name: `New Project`,
      model: availableModels[0],
      contextLength: 8184,
      systemPrompt: "",
    });
    setTimeout(() => {});
    setSelectedProjectId(projects[newIdx].id);
  };

  console.log({ selectedProject });
  const onDeleteProject = () => {
    if (!selectedProjectId) return;
    const oldIdx = projects.findIndex((p) => p.id === selectedProjectId);
    const newSelectedIdx = oldIdx === 0 ? 0 : oldIdx - 1;

    removeProject(selectedProjectId);
    setSelectedProjectId(projects[newSelectedIdx].id);
  };

  return (
    <SidebarProvider open={true}>
      <Sidebar
        variant="sidebar"
        collapsible={projects.length > 0 ? "none" : "offcanvas"}
      >
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {projects.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={project.id === selectedProjectId}
                      onClick={() => setSelectedProjectId(project.id)}
                    >
                      <span>{project.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="flex-row flex">
          <Button variant="outline" onClick={onAddProject}>
            <Plus />
          </Button>
          <Button
            variant="outline"
            onClick={onDeleteProject}
            disabled={!selectedProjectId}
          >
            <Minus />
          </Button>
        </SidebarFooter>
      </Sidebar>

      <div className="flex-1">
        {!selectedProject ? (
          <div className="p-4">
            <Button variant="default" onClick={onAddProject}>
              <Plus /> Add Project
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={selectedProject.name}
                onChange={(e) =>
                  updateProject(selectedProject.id, { name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select
                value={selectedProject.model}
                onValueChange={(value) =>
                  updateProject(selectedProject.id, { model: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contextLength">Context Length</Label>
              <Input
                id="contextLength"
                type="number"
                value={selectedProject.contextLength}
                onChange={(e) =>
                  updateProject(selectedProject.id, {
                    contextLength: parseInt(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                value={selectedProject.systemPrompt}
                onChange={(e) =>
                  updateProject(selectedProject.id, {
                    systemPrompt: e.target.value,
                  })
                }
                rows={4}
              />
            </div>
          </div>
        )}
      </div>
    </SidebarProvider>
  );
}
