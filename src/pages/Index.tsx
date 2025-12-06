import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Settings, Play, Sliders, Layers, Server, Code, TrendingUp, Cpu, Plus, ArrowRight, Sparkles, Zap, Activity, Upload, Save, X } from 'lucide-react';
import { toast } from "sonner";

// --- Types ---

interface Layer {
  id: number;
  type: 'Input' | 'Hidden' | 'Output';
  units: number;
  activation: string;
}

interface Hyperparameters {
  learningRate: number;
  optimizer: string;
  lossFunction: string;
  epochs: number;
  batchSize: number;
}

interface TrainingDataPoint {
  epoch: number;
  Loss: number;
  Accuracy: number;
  val_Loss?: number;
  val_Accuracy?: number;
  val_MAE?: number;
}

// --- Données et configurations de démonstration ---

const DATASETS = {
  iris: {
    name: 'Iris (Classification)',
    features: 4,
    output: 3,
    task: 'Classification',
    featureNames: ['Sepal Length', 'Sepal Width', 'Petal Length', 'Petal Width']
  },
  housing: {
    name: 'California Housing (Régression)',
    features: 8,
    output: 1,
    task: 'Régression',
    featureNames: ['MedInc', 'HouseAge', 'AveRooms', 'AveBedrms', 'Population', 'AveOccup', 'Latitude', 'Longitude']
  },
  cancer: {
    name: 'Breast Cancer (Classification)',
    features: 30,
    output: 2,
    task: 'Classification',
    featureNames: Array.from({ length: 30 }, (_, i) => `Feature ${i + 1}`)
  },
  custom: { name: 'Custom CSV', features: 0, output: 0, task: 'Unknown', featureNames: [] },
};

const initialIrisLayers: Layer[] = [
  { id: 1, type: 'Input', units: 4, activation: 'N/A' },
  { id: 2, type: 'Hidden', units: 16, activation: 'ReLU' },
  { id: 3, type: 'Hidden', units: 8, activation: 'ReLU' },
  { id: 4, type: 'Output', units: 3, activation: 'Softmax' },
];

// --- Composants ---

const LayerVisualization: React.FC<{
  layer: Layer;
  onClick: (id: number) => void;
  index: number;
  isTraining: boolean;
}> = ({ layer, onClick, index, isTraining }) => {
  const isClickable = layer.type === 'Hidden' || layer.type === 'Output';

  let bgGradient = '';
  let glowColor = '';

  if (layer.type === 'Input') {
    bgGradient = 'bg-gradient-to-br from-blue-500 to-blue-600';
    glowColor = 'hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]';
  } else if (layer.type === 'Output') {
    bgGradient = 'bg-gradient-to-br from-orange-500 to-red-500';
    glowColor = 'hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]';
  } else {
    bgGradient = 'bg-gradient-to-br from-emerald-500 to-teal-500';
    glowColor = 'hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]';
  }

  return (
    <div
      className={`relative p-6 rounded-2xl shadow-2xl text-white font-bold transition-all duration-500 transform hover:scale-110 hover:-translate-y-2
        ${bgGradient} ${glowColor} ${isClickable ? 'cursor-pointer' : ''} min-w-[160px] group
        ${isTraining ? 'animate-neural-pulse' : ''}`}
      onClick={isClickable ? () => onClick(layer.id) : undefined}
    >
      {/* Shine effect overlay */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 shimmer-effect animate-shimmer" />
      </div>

      <div className="relative z-10">
        <div className="text-xs opacity-90 uppercase tracking-widest mb-2 font-mono flex items-center gap-2">
          {layer.type === 'Input' && <Zap size={14} />}
          {layer.type === 'Hidden' && <Activity size={14} />}
          {layer.type === 'Output' && <Sparkles size={14} />}
          {layer.type === 'Hidden' ? `Couche ${index - 1}` : layer.type === 'Input' ? 'Entrée' : 'Sortie'}
        </div>
        <div className="text-4xl font-bold mt-2 mb-3 font-space">{layer.units}</div>
        <div className="text-xs opacity-80 font-mono bg-black/20 rounded-full px-3 py-1 inline-block">
          {layer.activation}
        </div>
      </div>

      {/* Decorative corner elements */}
      <div className="absolute top-2 right-2 w-2 h-2 bg-white/30 rounded-full" />
      <div className="absolute bottom-2 left-2 w-2 h-2 bg-white/30 rounded-full" />
    </div>
  );
};

const ConnectionLine: React.FC<{ isTraining: boolean }> = ({ isTraining }) => {
  return (
    <div className="relative flex items-center">
      {/* Main line */}
      <div className={`h-1 w-12 bg-gradient-to-r from-primary/50 via-accent to-primary/50 rounded-full transition-all duration-500
        ${isTraining ? 'animate-pulse' : ''}`} />

      {/* Animated dots */}
      {isTraining && (
        <>
          <div className="absolute left-0 w-2 h-2 bg-primary rounded-full animate-ping" />
          <div className="absolute right-0 w-2 h-2 bg-accent rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
        </>
      )}
    </div>
  );
};

const LayerConfigModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (units: number, activation: string) => void;
  onDelete: () => void;
  layer: Layer | undefined;
}> = ({ isOpen, onClose, onSave, onDelete, layer }) => {
  const [units, setUnits] = useState(layer?.units || 10);
  const [activation, setActivation] = useState(layer?.activation || 'ReLU');

  useEffect(() => {
    if (layer) {
      setUnits(layer.units);
      setActivation(layer.activation);
    }
  }, [layer]);

  if (!isOpen || !layer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(units, activation);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-card to-card/80 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-border/50 transform animate-scale-in">
        <h2 className="text-2xl font-bold text-card-foreground mb-6 flex items-center font-space">
          <Settings className="mr-3 text-primary animate-pulse" size={28} />
          Configuration Couche
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-card-foreground mb-3 uppercase tracking-wider font-mono">
              Nombre de Neurones
            </label>
            <input
              type="number"
              value={units}
              onChange={(e) => setUnits(parseInt(e.target.value))}
              min="1"
              required
              className="w-full p-4 border-2 border-input bg-background text-foreground rounded-xl focus:ring-4 focus:ring-primary/50 focus:border-primary transition-all font-space text-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-card-foreground mb-3 uppercase tracking-wider font-mono">
              Fonction d'Activation
            </label>
            <select
              value={activation}
              onChange={(e) => setActivation(e.target.value)}
              className="w-full p-4 border-2 border-input bg-background text-foreground rounded-xl focus:ring-4 focus:ring-primary/50 focus:border-primary transition-all font-space text-lg"
            >
              <option value="ReLU">ReLU</option>
              <option value="Sigmoid">Sigmoid</option>
              <option value="Tanh">Tanh</option>
            </select>
          </div>
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={onDelete}
              className="px-6 py-3 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all transform hover:scale-105 font-space uppercase tracking-wider"
            >
              Supprimer
            </button>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-sm font-bold text-foreground bg-secondary rounded-xl hover:bg-secondary/80 transition-all transform hover:scale-105 font-space uppercase tracking-wider"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-3 text-sm font-bold text-primary-foreground bg-gradient-to-r from-primary to-accent rounded-xl hover:shadow-lg hover:shadow-primary/50 transition-all transform hover:scale-105 font-space uppercase tracking-wider"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const SaveProjectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name);
    setName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-card to-card/80 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-border/50 transform animate-scale-in">
        <h2 className="text-2xl font-bold text-card-foreground mb-6 flex items-center font-space">
          <Save className="mr-3 text-primary animate-pulse" size={28} />
          Sauvegarder le Projet
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-card-foreground mb-3 uppercase tracking-wider font-mono">
              Nom du Projet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-4 border-2 border-input bg-background text-foreground rounded-xl focus:ring-4 focus:ring-primary/50 focus:border-primary transition-all font-space text-lg"
              placeholder="Mon Super Réseau"
            />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-foreground bg-secondary rounded-xl hover:bg-secondary/80 transition-all transform hover:scale-105 font-space uppercase tracking-wider"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-sm font-bold text-primary-foreground bg-gradient-to-r from-primary to-accent rounded-xl hover:shadow-lg hover:shadow-primary/50 transition-all transform hover:scale-105 font-space uppercase tracking-wider"
            >
              Sauvegarder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
const PredictionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onPredict: (inputs: number[]) => void;
  featureNames: string[];
  result: { value: number[], label: string } | null;
}> = ({ isOpen, onClose, onPredict, featureNames, result }) => {
  // 1. Initialisation de l'état : Initialisation avec la bonne taille et des valeurs par défaut ('0')
  const [inputs, setInputs] = useState<string[]>([]);

  // 2. Correction de la synchronisation de la taille et de la réinitialisation des inputs
  useEffect(() => {
    // Si la modal s'ouvre ET les featureNames sont disponibles
    if (isOpen && featureNames.length > 0 && inputs.length !== featureNames.length) {
      // Initialise ou ajuste la taille des inputs, avec '0' comme valeur par défaut
      setInputs(new Array(featureNames.length).fill('0'));
    }
    // Si la modal se ferme, réinitialiser pour la prochaine ouverture (facultatif mais propre)
    if (!isOpen) {
      setInputs([]);
    }
  }, [isOpen, featureNames]); // Dépend de l'ouverture et de la liste des features

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Assurez-vous que tous les champs non vides peuvent être convertis en nombres
    const numericInputs = inputs.map(val => parseFloat(val || '0'));

    // Validation des nombres (une vérification supplémentaire pour les entrées très étranges)
    if (numericInputs.some(isNaN)) {
      // @ts-ignore
      toast.error('Please enter valid numbers for all features');
      return;
    }

    onPredict(numericInputs);
  };

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-card to-card/80 p-8 rounded-3xl shadow-2xl w-full max-w-2xl border border-border/50 transform animate-scale-in max-h-[90vh] overflow-y-auto">

        {/* Bouton de fermeture en haut à droite */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-card-foreground/70 hover:text-card-foreground transition-colors"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-card-foreground mb-6 flex items-center font-space">
          <Sparkles className="mr-3 text-accent animate-pulse" size={28} />
          Make a Prediction
        </h2>

        {/* Le reste de la logique (affichage du résultat ou formulaire) reste correct */}
        {result ? (
          <div className="mb-8 p-6 bg-gradient-to-br from-success/20 to-emerald-500/20 rounded-2xl border border-success/50 text-center animate-fade-in">
            <h3 className="text-lg font-bold text-success mb-2 font-space uppercase tracking-wider">Result</h3>
            <p className="text-3xl font-bold text-foreground font-mono">{result.label}</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 text-sm font-bold text-foreground bg-secondary rounded-xl hover:bg-secondary/80 transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ... (Affichage d'une alerte si featureNames est vide) */}
            {featureNames.length === 0 ? (
              <p className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">
                Error: Model metadata (feature names) not loaded. Please train or load a project first.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featureNames.map((name, index) => (
                  <div key={index}>
                    <label className="block text-xs font-bold text-card-foreground mb-2 uppercase tracking-wider font-mono truncate" title={name}>
                      {name}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={inputs[index]}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      required
                      className="w-full p-3 border-2 border-input bg-background text-foreground rounded-xl focus:ring-4 focus:ring-primary/50 focus:border-primary transition-all font-mono"
                      placeholder="0.0"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-sm font-bold text-foreground bg-secondary rounded-xl hover:bg-secondary/80 transition-all transform hover:scale-105 font-space uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={featureNames.length === 0} // Désactiver si aucune feature n'est chargée
                className="px-6 py-3 text-sm font-bold text-primary-foreground bg-gradient-to-r from-primary to-accent rounded-xl hover:shadow-lg hover:shadow-primary/50 transition-all transform hover:scale-105 font-space uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Predict
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// export default PredictionModal; // N'oubliez pas l'export

// --- Composant Principal ---

const Index = () => {
  const [selectedDataset, setSelectedDataset] = useState<keyof typeof DATASETS>('iris');
  const [layers, setLayers] = useState<Layer[]>(initialIrisLayers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLayerId, setEditingLayerId] = useState<number | null>(null);
  const [status, setStatus] = useState<'Idle' | 'Training' | 'Done'>('Idle');
  const [trainingData, setTrainingData] = useState<TrainingDataPoint[]>([]);
  const [hyperparameters, setHyperparameters] = useState<Hyperparameters>({
    learningRate: 0.001,
    optimizer: 'Adam',
    lossFunction: 'Categorical Crossentropy',
    epochs: 50,
    batchSize: 32,
  });

  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customFilename, setCustomFilename] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState<string>('');

  const [datasetInfo, setDatasetInfo] = useState<{ name: string, features: number, output: number, task: string, featureNames?: string[] } | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isPredictionModalOpen, setIsPredictionModalOpen] = useState(false);
  const [predictionResult, setPredictionResult] = useState<{ value: number[], label: string } | null>(null);
  const [featureNames, setFeatureNames] = useState<string[]>([]);
  const [predictionInputs, setPredictionInputs] = useState<number[]>([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get('projectId');

  // Load project if projectId is present
  useEffect(() => {
    if (projectId) {
      const fetchProject = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
          const response = await fetch(`http://localhost:5000/get_project/${projectId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success) {
            const project = data.project;
            setLayers(project.layers);
            setHyperparameters(project.hyperparameters);
            setDatasetInfo(project.datasetInfo);
            setSelectedDataset(project.selectedDataset);
            // Restore selected features if saved, otherwise default to all
            // Note: Project saving/loading might need update to store selectedFeatures if we want persistence
            // For now, default to all features from datasetInfo
            if (project.datasetInfo?.featureNames) {
              setSelectedFeatures(project.datasetInfo.featureNames);
            }
            toast.success(`Project "${project.name}" loaded!`);
          } else {
            toast.error('Failed to load project');
          }
        } catch (error) {
          console.error('Error loading project:', error);
          toast.error('Error loading project');
        }
      };
      fetchProject();
    }
  }, [projectId]);

  useEffect(() => {
    const dataset = DATASETS[selectedDataset];
    if (dataset && selectedDataset !== 'custom') {
      setDatasetInfo(dataset);
      // Reset selected features to all
      if (dataset.featureNames) {
        setSelectedFeatures(dataset.featureNames);
      }
      updateLayersForDataset(dataset);
    } else if (selectedDataset === 'custom') {
      // Reset info for custom until loaded
      if (!customFilename) {
        setDatasetInfo(null);
        setSelectedFeatures([]);
      }
    }
  }, [selectedDataset, customFilename]);

  // Update Input layer when selectedFeatures changes
  useEffect(() => {
    setLayers(prev => prev.map(l =>
      l.type === 'Input' ? { ...l, units: selectedFeatures.length } : l
    ));
  }, [selectedFeatures]);
  const updateLayersForDataset = (dataset: any) => {
    const newLayers: Layer[] = layers.map(layer => {
      if (layer.type === 'Input') {
        return { ...layer, units: dataset.features };
      }
      if (layer.type === 'Output') {
        const newActivation = dataset.task === 'Classification' ? 'Softmax' : 'Linear';
        const newLoss = dataset.task === 'Classification' ? 'Categorical Crossentropy' : 'MSE';

        setHyperparameters(prev => ({
          ...prev,
          lossFunction: newLoss,
        }));

        return { ...layer, units: dataset.output, activation: newActivation };
      }
      return layer;
    });
    setLayers(newLayers);
  };

  const handleLayerClick = (id: number) => {
    const layer = layers.find(l => l.id === id);
    if (layer && (layer.type === 'Hidden' || layer.type === 'Output')) {
      setEditingLayerId(id);
      setIsModalOpen(true);
    }
  };
  const loadModelMetadata = async () => {
    try {
      const response = await fetch('http://localhost:5000/model_metadata', {
        method: 'GET',
      });
      const data = await response.json();

      if (data.success) {
        setFeatureNames(data.feature_names);
        // setPredictionInputs(Array(data.input_dim).fill(0)); // Optionnel : initialiser les inputs
      } else {
        // Gérer le cas où le modèle n'est pas encore chargé
        setFeatureNames([]);
      }
    } catch (error) {
      console.error('Error loading model metadata:', error);
    }
  };

  const handleUpdateLayer = (newUnits: number, newActivation: string) => {
    setLayers(prevLayers =>
      prevLayers.map(layer =>
        layer.id === editingLayerId
          ? { ...layer, units: newUnits, activation: newActivation }
          : layer
      )
    );
    setIsModalOpen(false);
    setEditingLayerId(null);
  };

  const handleDeleteLayer = () => {
    if (editingLayerId !== null) {
      // Prevent deleting Output layer
      const layer = layers.find(l => l.id === editingLayerId);
      if (layer?.type === 'Output') {
        toast.error("Cannot delete Output layer");
        return;
      }
      setLayers(prevLayers => prevLayers.filter(l => l.id !== editingLayerId));
      setIsModalOpen(false);
      setEditingLayerId(null);
    }
  };

  const handleAddLayer = () => {
    setLayers(prevLayers => {
      const newId = Math.max(...prevLayers.map(l => l.id)) + 1;
      const newHiddenLayer: Layer = { id: newId, type: 'Hidden', units: 10, activation: 'ReLU' };

      const outputIndex = prevLayers.findIndex(l => l.type === 'Output');
      const newLayers = [...prevLayers];
      newLayers.splice(outputIndex, 0, newHiddenLayer);
      return newLayers;
    });
  };

  const handleHyperparameterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setHyperparameters(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCustomFile(file);

      // Upload file immediately to analyze
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://localhost:5000/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.success) {
          setCustomFilename(data.filename);
          setColumns(data.columns || []);
          // Default target to last column if available
          if (data.columns && data.columns.length > 0) {
            setTargetColumn(data.columns[data.columns.length - 1]);
          }

          // Update dataset info based on analysis
          const newDatasetInfo = {
            name: 'Custom CSV',
            features: data.features,
            output: data.output,
            task: data.task,
            featureNames: data.columns ? data.columns.slice(0, -1) : []
          };
          setDatasetInfo(newDatasetInfo);
          if (newDatasetInfo.featureNames) {
            setSelectedFeatures(newDatasetInfo.featureNames);
          }
          // Update layers
          updateLayersForDataset(newDatasetInfo);
        } else {
          alert('Erreur upload: ' + data.message);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Erreur lors de l\'upload du fichier.');
      }
    }
  };

  // Effect to update features count when target column changes
  useEffect(() => {
    const updateTargetAnalysis = async () => {
      if (selectedDataset === 'custom' && targetColumn && customFilename) {
        try {
          const response = await fetch('http://localhost:5000/analyze_target', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: customFilename, targetColumn })
          });
          const data = await response.json();
          if (data.success) {
            const newDatasetInfo = {
              name: 'Custom CSV',
              features: data.features,
              output: data.output,
              task: data.task,
              featureNames: data.columns ? data.columns.slice(0, -1) : []
            };
            setDatasetInfo(newDatasetInfo);
            if (newDatasetInfo.featureNames) {
              setSelectedFeatures(newDatasetInfo.featureNames);
            }
            updateLayersForDataset(newDatasetInfo);
          }
        } catch (error) {
          console.error("Error analyzing target:", error);
        }
      }
    };
    updateTargetAnalysis();
  }, [targetColumn, selectedDataset, customFilename]);

  const handleTrain = async () => {
    if (status === 'Training') return;

    if (selectedDataset === 'custom' && !customFilename) {
      alert('Veuillez uploader un fichier CSV pour le dataset personnalisé.');
      return;
    }
    setFeatureNames([]);
    setStatus('Training');
    setTrainingData([]);

    try {
      const response = await fetch('http://localhost:5000/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          layers,
          hyperparameters,
          selectedDataset,
          customFilename,
          targetColumn,
          featureColumns: selectedFeatures
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTrainingData(data.history);
        loadModelMetadata();
        setStatus('Done');
      } else {
        alert('Erreur d\'entraînement: ' + data.message);
        setStatus('Idle');
      }
    } catch (error) {
      console.error('Error training model:', error);
      alert('Erreur de connexion au serveur.');
      setStatus('Idle');
    }
  };

  const handleSaveProject = async (name: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to save projects');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/save_project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          layers,
          hyperparameters,
          datasetInfo,
          selectedDataset,
          customFilename
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Project saved successfully!');
        setIsSaveModalOpen(false);
      } else {
        toast.error(data.message || 'Failed to save project');
      }
    } catch (error) {
      toast.error('Error saving project');
    }
  };

  const handlePredict = async (inputs: number[]) => {
    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputs })
      });
      const data = await response.json();
      if (data.success) {
        setPredictionResult({ value: data.prediction_value, label: data.prediction_label });
        toast.success('Prediction successful!');
      } else {
        toast.error(data.message || 'Prediction failed');
      }
    } catch (error) {
      console.error('Error predicting:', error);
      toast.error('Error connecting to server');
    }
  };

  const editingLayer = layers.find(l => l.id === editingLayerId);

  const trainButtonDisabled = status === 'Training';
  let trainButtonText = 'Entraîner le Modèle';
  let trainButtonIcon = <Play size={22} />;
  let trainButtonStyle = 'bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%] hover:bg-right';

  if (status === 'Training') {
    trainButtonText = 'Entraînement...';
    trainButtonIcon = <Cpu size={22} className="animate-spin" />;
    trainButtonStyle = 'bg-gradient-to-r from-warning to-orange-500 cursor-not-allowed';
  } else if (status === 'Done') {
    trainButtonText = 'Terminé !';
    trainButtonIcon = <Sparkles size={22} />;
    trainButtonStyle = 'bg-gradient-to-r from-success to-emerald-600';
  }

  // Determine metric name and key based on task
  const isClassification = datasetInfo?.task === 'Classification' || datasetInfo?.task === 'classification';
  const metricName = isClassification ? 'Accuracy' : 'MAE';
  const metricKey = isClassification ? 'Accuracy' : 'MAE';
  const valMetricKey = isClassification ? 'val_Accuracy' : 'val_MAE';

  return (
    <div className="min-h-screen bg-background gradient-mesh p-4 md:p-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />

      {/* En-tête */}
      <header className="mb-10 animate-fade-in flex justify-between items-center">
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={() => navigate('/dashboard')} // Or use navigate(-1) to go back to previous history
            className="p-3 bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-foreground rounded-2xl transition-all duration-300 border border-transparent hover:border-border/50 group"
            title="Back to Dashboard"
          >
            <ArrowLeft size={28} className="transform group-hover:-translate-x-1 transition-transform duration-300" />
          </button>
          <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-lg animate-float">
            <Layers className="text-white" size={40} />
          </div>
          <div>
            <h1 className="text-5xl font-bold text-foreground font-space bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Neural Network Builder
            </h1>
            <p className="text-muted-foreground text-lg mt-1 font-mono">
              Design • Train • Visualize
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-all border border-primary/20"
          >
            <Save size={18} />
            <span className="hidden md:inline">Sauvegarder</span>
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-xl border border-border/50">
            <Server size={18} className="text-muted-foreground" />
            <span className="text-sm font-mono text-muted-foreground">Localhost:5000</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-2" />
          </div>
        </div>
      </header>

      {/* Layout principal */}
      <main className="flex flex-col lg:flex-row gap-6">

        {/* Colonne 1: Contrôles */}
        <div className="w-full lg:w-1/4 space-y-6 animate-slide-in-right" style={{ animationDelay: '0.1s' }}>

          {/* Configuration des Données */}
          <div className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10">
            <h2 className="text-lg font-bold text-card-foreground flex items-center mb-5 font-space">
              <Server size={22} className="mr-3 text-info" />
              Données
            </h2>
            <label htmlFor="dataset" className="block text-sm font-bold text-card-foreground mb-2 uppercase tracking-wider font-mono">
              Dataset
            </label>
            <select
              id="dataset"
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value as keyof typeof DATASETS)}
              className="w-full p-3 border-2 border-input bg-background text-foreground rounded-xl focus:ring-4 focus:ring-primary/50 focus:border-primary transition-all font-space"
            >
              {Object.entries(DATASETS).map(([key, value]) => (
                <option key={key} value={key}>{value.name}</option>
              ))}
            </select>

            {/* Feature Selection */}
            {datasetInfo?.featureNames && datasetInfo.featureNames.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-bold text-card-foreground mb-2 uppercase tracking-wider font-mono">
                  Features ({selectedFeatures.length})
                </label>
                <div className="max-h-40 overflow-y-auto space-y-2 border border-input rounded-xl p-3 bg-background/50">
                  {datasetInfo.featureNames.map((feature) => (
                    <div key={feature} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`feature-${feature}`}
                        checked={selectedFeatures.includes(feature)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFeatures(prev => [...prev, feature]);
                          } else {
                            // Prevent deselecting all features
                            if (selectedFeatures.length > 1) {
                              setSelectedFeatures(prev => prev.filter(f => f !== feature));
                            } else {
                              toast.error("At least one feature must be selected");
                            }
                          }
                        }}
                        className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <label htmlFor={`feature-${feature}`} className="text-sm text-foreground font-mono truncate cursor-pointer select-none">
                        {feature}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDataset === 'custom' && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-card-foreground mb-2 uppercase tracking-wider font-mono">
                    Fichier CSV
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer bg-background hover:bg-secondary/50 border-input hover:border-primary transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground"><span className="font-bold">Cliquez pour upload</span></p>
                        <p className="text-xs text-muted-foreground">CSV</p>
                      </div>
                      <input id="dropzone-file" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>
                  {customFile && (
                    <p className="text-xs text-success mt-2 font-mono truncate">
                      Fichier: {customFile.name}
                    </p>
                  )}
                </div>

                {columns.length > 0 && (
                  <div>
                    <label className="block text-sm font-bold text-card-foreground mb-2 uppercase tracking-wider font-mono">
                      Colonne Cible (Target)
                    </label>
                    <select
                      value={targetColumn}
                      onChange={(e) => setTargetColumn(e.target.value)}
                      className="w-full p-3 border-2 border-input bg-background text-foreground rounded-xl focus:ring-4 focus:ring-primary/50 focus:border-primary transition-all font-space"
                    >
                      {columns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 p-4 bg-gradient-to-br from-secondary to-secondary/50 rounded-xl border border-border/30">
              <p className="text-sm text-secondary-foreground font-bold font-mono">
                Tâche: {datasetInfo ? datasetInfo.task : 'En attente...'}
              </p>
              <p className="text-sm text-muted-foreground mt-2 font-mono">
                Features: <span className="text-accent font-bold">
                  {datasetInfo ? datasetInfo.features : '?'}
                </span> •
                Output: <span className="text-accent font-bold">
                  {datasetInfo ? datasetInfo.output : '?'}
                </span>
              </p>
            </div>
          </div>

          {/* Hyperparamètres */}
          <div className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10">
            <h2 className="text-lg font-bold text-card-foreground flex items-center mb-5 font-space">
              <Sliders size={22} className="mr-3 text-primary" />
              Hyperparamètres
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-card-foreground mb-2 uppercase tracking-wider font-mono">
                  Learning Rate
                </label>
                <input
                  type="number"
                  name="learningRate"
                  value={hyperparameters.learningRate}
                  onChange={handleHyperparameterChange}
                  step="0.0001"
                  min="0"
                  className="w-full p-3 border-2 border-input bg-background text-foreground rounded-xl focus:ring-4 focus:ring-primary/50 focus:border-primary transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-card-foreground mb-2 uppercase tracking-wider font-mono">
                  Optimizer
                </label>
                <select
                  name="optimizer"
                  value={hyperparameters.optimizer}
                  onChange={handleHyperparameterChange}
                  className="w-full p-3 border-2 border-input bg-background text-foreground rounded-xl focus:ring-4 focus:ring-primary/50 focus:border-primary transition-all font-space"
                >
                  <option value="Adam">Adam</option>
                  <option value="SGD">SGD</option>
                  <option value="RMSprop">RMSprop</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-card-foreground mb-2 uppercase tracking-wider font-mono">
                  Loss Function
                </label>
                <select
                  name="lossFunction"
                  value={hyperparameters.lossFunction}
                  onChange={handleHyperparameterChange}
                  className="w-full p-3 border-2 border-input bg-background text-foreground rounded-xl focus:ring-4 focus:ring-primary/50 focus:border-primary transition-all font-space"
                  disabled={status === 'Training'}
                >
                  <option value="Categorical Crossentropy">Categorical Crossentropy</option>
                  <option value="Binary Crossentropy">Binary Crossentropy</option>
                  <option value="MSE">MSE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-card-foreground mb-2 uppercase tracking-wider font-mono">
                  Epochs
                </label>
                <input
                  type="number"
                  name="epochs"
                  value={hyperparameters.epochs}
                  onChange={handleHyperparameterChange}
                  min="1"
                  className="w-full p-3 border-2 border-input bg-background text-foreground rounded-xl focus:ring-4 focus:ring-primary/50 focus:border-primary transition-all font-mono"
                />
              </div>
            </div>
          </div>

          {/* Bouton d'Action */}
          <button
            onClick={handleTrain}
            disabled={trainButtonDisabled}
            className={`w-full flex items-center justify-center gap-3 py-5 px-6 font-bold text-white rounded-2xl shadow-2xl transition-all duration-500 transform hover:scale-105 ${trainButtonStyle} disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-space uppercase tracking-wider text-lg`}
          >
            {trainButtonIcon}
            <span>{trainButtonText}</span>
          </button>
        </div>

        {/* Colonne 2: Canvas du Réseau */}
        <div className="w-full lg:w-1/2 p-8 bg-card/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-border/50 flex flex-col animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-bold text-card-foreground mb-8 flex items-center font-space">
            <Code size={28} className="mr-3 text-primary" />
            Architecture Neuronale
          </h2>

          <div className="flex-grow flex flex-col md:flex-row items-center justify-center md:gap-8 gap-8 p-6 overflow-x-auto">
            {layers.map((layer, index) => (
              <React.Fragment key={layer.id}>
                <LayerVisualization
                  layer={layer}
                  onClick={handleLayerClick}
                  index={index + 1}
                  isTraining={status === 'Training'}
                />
                {index < layers.length - 1 && (
                  <ConnectionLine isTraining={status === 'Training'} />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleAddLayer}
              className="flex items-center gap-3 px-8 py-4 text-sm font-bold text-accent-foreground bg-gradient-to-r from-accent to-emerald-500 rounded-full hover:shadow-xl hover:shadow-accent/50 transition-all transform hover:scale-110 font-space uppercase tracking-wider"
            >
              <Plus size={20} />
              <span>Ajouter Couche</span>
            </button>
          </div>
        </div>

        {/* Colonne 3: Résultats */}
        <div className="w-full lg:w-1/4 space-y-6 animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
          <div className="bg-card/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-border/50 hover:border-success/50 transition-all duration-300">
            <h2 className="text-lg font-bold text-card-foreground flex items-center mb-5 font-space">
              <TrendingUp size={22} className="mr-3 text-success" />
              Résultats
            </h2>

            {/* Statut */}
            <div className={`p-4 rounded-xl text-sm font-bold mb-5 font-mono uppercase tracking-wider text-center transition-all duration-500 ${status === 'Done' ? 'bg-gradient-to-r from-success/20 to-emerald-500/20 text-success border-2 border-success/50' :
              status === 'Training' ? 'bg-gradient-to-r from-warning/20 to-orange-500/20 text-warning border-2 border-warning/50 animate-pulse' :
                'bg-muted text-muted-foreground border-2 border-border'
              }`}>
              {status === 'Idle' ? '⚡ En attente' : status === 'Training' ? '🔄 Entraînement...' : '✓ Terminé'}
            </div>

            {/* Graphique */}
            {trainingData.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm font-bold text-card-foreground uppercase tracking-wider font-mono flex items-center gap-2">
                  <Activity size={16} className="text-primary" />
                  Performance
                </div>
                <div className="w-full h-52 bg-background/50 rounded-xl p-4 border border-border/30">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trainingData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        dataKey="epoch"
                        stroke="hsl(var(--muted-foreground))"
                        style={{ fontSize: '12px', fontFamily: 'JetBrains Mono' }}
                      />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="hsl(var(--primary))"
                        domain={[0, 'auto']}
                        style={{ fontSize: '12px', fontFamily: 'JetBrains Mono' }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="hsl(var(--accent))"
                        domain={[0, 1.0]}
                        style={{ fontSize: '12px', fontFamily: 'JetBrains Mono' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '2px solid hsl(var(--border))',
                          borderRadius: '12px',
                          fontFamily: 'JetBrains Mono',
                          fontSize: '12px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="Loss"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        name="Loss"
                        dot={false}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="val_Loss"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Val Loss"
                        dot={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey={metricKey}
                        stroke="hsl(var(--accent))"
                        strokeWidth={3}
                        name={metricName}
                        dot={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey={valMetricKey}
                        stroke="hsl(var(--accent))"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name={`Val ${metricName}`}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/30">
                    <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">Loss</p>
                    <p className="text-2xl font-bold text-primary font-mono">
                      {trainingData[trainingData.length - 1].Loss.toFixed(4)}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/30">
                    <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">{metricName}</p>
                    <p className="text-2xl font-bold text-accent font-mono">
                      {trainingData[trainingData.length - 1][metricKey]?.toFixed(4) || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {trainingData.length === 0 && status !== 'Training' && (
              <div className="text-center py-12 px-4">
                <div className="inline-block p-4 bg-muted/50 rounded-full mb-4">
                  <TrendingUp size={32} className="text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground font-mono">
                  Lancez l'entraînement pour voir les métriques
                </p>
              </div>
            )}

            {status === 'Done' && (
              <button
                onClick={() => {
                  setPredictionResult(null);
                  setIsPredictionModalOpen(true);
                }}
                className="w-full mt-4 py-4 px-6 font-bold text-accent-foreground bg-gradient-to-r from-accent to-purple-500 rounded-xl shadow-lg hover:shadow-accent/50 transition-all transform hover:scale-105 font-space uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Sparkles size={20} />
                Test / Predict
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Modale */}
      <LayerConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleUpdateLayer}
        onDelete={handleDeleteLayer}
        layer={editingLayer}
      />

      <SaveProjectModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveProject}
      />

      <PredictionModal
        isOpen={isPredictionModalOpen}
        onClose={() => setIsPredictionModalOpen(false)}
        onPredict={handlePredict}
        // NEW: Prioritizes Server Metadata (featureNames state), falls back to UI Selection (selectedFeatures)
        featureNames={featureNames.length > 0 ? featureNames : selectedFeatures}
        result={predictionResult}
      />
    </div>
  );
};

export default Index;
