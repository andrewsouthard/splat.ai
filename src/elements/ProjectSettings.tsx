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

  const onAddProject = async () =>
    addProject(
      {
        name: `New Project`,
        model: availableModels[0],
        contextLength: 8184,
        systemPrompt: "",
      },
      (id) => setSelectedProjectId(id)
    );

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
      <div className="flex max-h-[500px] w-full">
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

        <div className="flex-1 h-full w-full">
          {!selectedProject ? (
            <div className="p-4">
              <Button variant="default" onClick={onAddProject}>
                <Plus /> Add Project
              </Button>
            </div>
          ) : (
            <div className="px-4 pb-4 space-y-4 w-full">
              <div className="space-y-1 mb-1">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  className="bg-white w-full"
                  id="name"
                  value={selectedProject.name}
                  onChange={(e) =>
                    updateProject(selectedProject.id, { name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1 mb-1">
                <Label htmlFor="model">Model</Label>
                <Select
                  value={selectedProject.model}
                  onValueChange={(value) =>
                    updateProject(selectedProject.id, { model: value })
                  }
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem
                        key={model}
                        value={model}
                        className="bg-white"
                      >
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 mb-1">
                <Label htmlFor="contextLength">Context Length</Label>
                <Input
                  id="contextLength"
                  className="bg-white"
                  type="number"
                  value={selectedProject.contextLength}
                  onChange={(e) =>
                    updateProject(selectedProject.id, {
                      contextLength: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  value={selectedProject.systemPrompt}
                  className="bg-white"
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
      </div>
    </SidebarProvider>
  );
}
