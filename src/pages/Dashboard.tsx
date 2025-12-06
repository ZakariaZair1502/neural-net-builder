import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, BrainCircuit, User, FolderOpen, Clock, Trash2 } from 'lucide-react';

interface Project {
    _id: string;
    name: string;
    created_at: string;
    datasetInfo?: {
        name: string;
        task: string;
    };
    model_file_id?: string;
    dataset_file_id?: string;
}

const Dashboard = () => {
    const [user, setUser] = useState<string | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchDashboard = async () => {
            try {
                const response = await fetch('http://localhost:5000/dashboard', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (data.success) {
                    setUser(data.user);
                } else {
                    handleLogout();
                }
            } catch (error) {
                handleLogout();
            }
        };

        const fetchProjects = async () => {
            try {
                const response = await fetch('http://localhost:5000/get_projects', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (data.success) {
                    setProjects(data.projects);
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
            }
        };

        fetchDashboard();
        fetchProjects();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        toast.info('Logged out successfully');
        navigate('/login');
    };

    const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:5000/delete_project/${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setProjects(projects.filter(p => p._id !== projectId));
                toast.success('Project deleted successfully');
            } else {
                toast.error(data.message || 'Failed to delete project');
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            toast.error('Error deleting project');
        }
    };

    return (
        <div className="min-h-screen bg-background gradient-mesh p-8">
            <header className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <BrainCircuit className="text-primary h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-bold font-space">NN Maker Dashboard</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
                        <User size={18} />
                        <span className="font-mono font-bold">{user}</span>
                    </div>
                    <Button variant="destructive" onClick={handleLogout} className="gap-2">
                        <LogOut size={18} />
                        Logout
                    </Button>
                </div>
            </header>

            <main className="space-y-8">
                <section>
                    <h2 className="text-2xl font-bold mb-6 font-space flex items-center gap-2">
                        <BrainCircuit className="text-accent" />
                        Start New
                    </h2>
                    <Card className="hover:shadow-lg transition-all cursor-pointer border-primary/20 hover:border-primary w-full md:w-1/3" onClick={() => navigate('/builder')}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <PlusCircle className="text-primary" />
                                New Project
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Start building a new neural network from scratch.</p>
                            <Button className="w-full mt-4 bg-gradient-to-r from-primary to-accent">Open Builder</Button>
                        </CardContent>
                    </Card>
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-6 font-space flex items-center gap-2">
                        <FolderOpen className="text-accent" />
                        Your Projects
                    </h2>
                    {projects.length === 0 ? (
                        <div className="text-center py-12 bg-card/50 rounded-xl border border-dashed border-border">
                            <p className="text-muted-foreground">No projects saved yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project) => (
                                <Card key={project._id} className="hover:shadow-lg transition-all cursor-pointer border-border hover:border-accent group" onClick={() => navigate(`/builder?projectId=${project._id}`)}>
                                    <CardHeader>
                                        <CardTitle className="flex justify-between items-start">
                                            <span className="truncate">{project.name}</span>
                                            <FolderOpen size={18} className="text-muted-foreground group-hover:text-accent transition-colors" />
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} />
                                                {new Date(project.created_at).toLocaleDateString()}
                                            </div>
                                            {project.datasetInfo && (
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="px-2 py-1 bg-secondary rounded text-xs font-mono">
                                                        {project.datasetInfo.name}
                                                    </span>
                                                    <span className="px-2 py-1 bg-secondary rounded text-xs font-mono">
                                                        {project.datasetInfo.task}
                                                    </span>
                                                    {project.model_file_id && (
                                                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-xs font-mono flex items-center gap-1">
                                                            <BrainCircuit size={10} /> Model
                                                        </span>
                                                    )}
                                                    {project.dataset_file_id && (
                                                        <span className="px-2 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded text-xs font-mono flex items-center gap-1">
                                                            <FolderOpen size={10} /> Data
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <Button variant="outline" className="flex-1 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                                                Open Project
                                            </Button>
                                            <Button variant="destructive" size="icon" onClick={(e) => handleDeleteProject(project._id, e)} className="opacity-0 group-hover:opacity-100 transition-opacity" title="Delete Project">
                                                <Trash2 size={18} />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

// Helper component for PlusCircle since it was missing in imports
const PlusCircle = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>
);

export default Dashboard;
