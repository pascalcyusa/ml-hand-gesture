import { useState, useCallback, useRef, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";

import WebcamPanel from "./WebcamPanel.jsx";
import ClassCard from "./ClassCard.jsx";
import PredictionBars from "./PredictionBars.jsx";
import TrainingControls from "./TrainingControls.jsx";
import AIRecipeCard from "./AIRecipeCard.jsx";
import LoadingOverlay from "../common/LoadingOverlay.jsx";
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from "../../utils/helpers.js";
import "./TrainTab.css";

export default function TrainTab({
  showToast,
  hand,
  cm,
  trainer,
  prediction,
  storage,
  auth,
  aiRecipe,
  setAiRecipe,
}) {
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [savedModels, setSavedModels] = useState([]);

  useEffect(() => {
    console.log("--- AI RECIPE STATE CHANGE ---", aiRecipe);
  }, [aiRecipe]);

  const [isCameraStarted, setIsCameraStarted] = useState(
    hand.wasStarted || hand.isRunning,
  );
  const videoReadyRef = useRef(false);

  // ── Fetch saved models on mount ──
  const refreshModels = useCallback(async () => {
    if (auth && auth.user) {
      const models = await storage.listMyModels();
      setSavedModels(models);
    } else {
      setSavedModels([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user, storage]);

  useEffect(() => {
    refreshModels();
  }, [refreshModels]);

  // ── Start detection when webcam is ready ──
  const handleVideoReady = useCallback(
    async (videoEl, canvasEl) => {
      if (videoReadyRef.current) return;
      videoReadyRef.current = true;
      // Only show loading overlay on first start (model not yet loaded)
      const needsModelLoad = !hand.isRunning;
      if (needsModelLoad) {
        setShowLoadingOverlay(true);
        setLoadingMessage("Setting up the AI eyes...");
      }
      try {
        await hand.start(videoEl, canvasEl);
        if (needsModelLoad) {
          showToast("The AI can see your hands now!", "success");
        }
      } catch (err) {
        console.error("Hand detection start error:", err);
        showToast("Failed to start the AI vision", "error");
      } finally {
        if (needsModelLoad) {
          setShowLoadingOverlay(false);
        }
      }
    },
    [hand, showToast],
  );

  // ── Handle webcam errors ──
  useEffect(() => {
    if (hand.error) {
      // Use the enhanced error message if available, otherwise fall back to the original
      const errorMessage =
        hand.error.message || `Camera error: ${hand.error.name}`;
      showToast(errorMessage, "error");
      setIsCameraStarted(false);
    }
  }, [hand.error, showToast]);

  const handleStartCamera = useCallback(() => {
    setIsCameraStarted(true);
  }, []);

  // Helper to calculate landmark statistics for the AI ML-Coach
  const calculateDatasetStats = useCallback((trainingData, classNames) => {
    const stats = {};
    const { features, labels } = trainingData; // features: [ [x1,y1,z1...], ... ], labels: [ classIdx, ... ]

    classNames.forEach((name, idx) => {
      const classSamples = features.filter((_, i) => labels[i] === idx);
      if (classSamples.length === 0) return;

      // Centroid (average feature vector)
      const centroid = classSamples[0].map(
        (_, featureIdx) =>
          classSamples.reduce((sum, sample) => sum + sample[featureIdx], 0) /
          classSamples.length,
      );

      // Variance (avg Euclidean distance of samples to centroid)
      const variance =
        classSamples.reduce((sum, sample) => {
          const dist = Math.sqrt(
            sample.reduce((s, val, i) => s + Math.pow(val - centroid[i], 2), 0),
          );
          return sum + dist;
        }, 0) / classSamples.length;

      stats[name] = {
        example_count: classSamples.length,
        variance: parseFloat(variance.toFixed(4)),
        centroid: centroid.slice(0, 3), // First 3 values (wrist x,y,z) as a representative point
      };
    });

    // Overlap (distance between class centroids)
    const overlaps = [];
    const names = Object.keys(stats);
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const c1 = stats[names[i]].centroid;
        const c2 = stats[names[j]].centroid;
        const dist = Math.sqrt(
          c1.reduce((s, val, idx) => s + Math.pow(val - c2[idx], 2), 0),
        );
        overlaps.push({
          pair: [names[i], names[j]],
          distance: parseFloat(dist.toFixed(4)),
        });
      }
    }

    return { class_stats: stats, overlaps };
  }, []);

  // ── Collect sample ──
  const handleCollect = useCallback(
    (classId) => {
      if (!hand.currentLandmarks) {
        showToast("No hand detected — show your hand to the camera", "warning");
        return;
      }
      const success = cm.collectSample(classId, hand.currentLandmarks);
      if (success) {
        // Optional: shorter toast or no toast to avoid spam
        // showToast('Sample collected!', 'success');
      }
    },
    [hand.currentLandmarks, cm, showToast],
  );

  // ── Train model ──
  const handleTrain = useCallback(async () => {
    prediction.stopPredicting();
    setShowLoadingOverlay(true);
    setLoadingMessage("Teaching the model your gestures...");

    try {
      const trainingData = cm.getTrainingData();

      if (auth.user) {
        setLoadingMessage("Saving your progress...");
        await storage.saveTrainingSession(cm.classNames, {
          features: trainingData.features,
          labels: trainingData.labels,
        });
        setLoadingMessage("Teaching the model your gestures...");
      }

      const success = await trainer.train(trainingData);

      if (success) {
        showToast("Training Completed!", "success");
        prediction.startPredicting();

        // Generate AI Recipe
        if (auth.user) {
          console.log(
            "User is logged in, generating AI recipe for:",
            cm.classNames,
          );
          setLoadingMessage("AI Coach is thinking of some cool ideas...");

          // Calculate stats for the ML-Coach
          const stats = calculateDatasetStats(trainingData, cm.classNames);

          const result = await storage.generateAIRecipe(cm.classNames, stats);
          console.log("AI recipe result:", result);
          if (result && !result.error) {
            setAiRecipe(result);
            showToast("Your AI Recipe is ready! ✨", "success");
          } else if (result && result.error) {
            showToast(`AI Recipe Error: ${result.error}`, "warning");
          }
        } else {
          showToast(
            "Log in to unlock AI-powered ideas for your robot!",
            "info",
          );
        }
      } else {
        showToast("Oops! The AI got confused. Try training again.", "error");
      }
    } catch (err) {
      console.error("Training handler error:", err);
      showToast("An unexpected error occurred during training", "error");
    } finally {
      setShowLoadingOverlay(false);
    }
  }, [
    cm,
    trainer,
    prediction,
    showToast,
    auth,
    storage,
    calculateDatasetStats,
  ]);

  // ── Reset ──
  const handleReset = useCallback(() => {
    prediction.stopPredicting();
    trainer.resetModel();
    cm.reset();
    setAiRecipe(null);
    showToast("All data cleared", "info");
  }, [prediction, trainer, cm, showToast]);

  // ── AI Recipe Application Handlers ──
  const handleApplyPiano = useCallback(
    async (recipe) => {
      if (!recipe || !recipe.piano_config) return;
      setLoadingMessage("Applying AI Piano Sequence...");
      setShowLoadingOverlay(true);
      try {
        const success = await storage.savePianoSequence(
          `${recipe.recipe_name} (AI)`,
          recipe.piano_config,
          true,
        );
        if (success)
          showToast("AI Piano Sequence applied and saved!", "success");
        else showToast("Failed to apply AI sequence", "error");
      } finally {
        setShowLoadingOverlay(false);
      }
    },
    [storage, showToast],
  );

  const handleApplyMotors = useCallback(
    async (recipe) => {
      if (!recipe || !recipe.motor_config) return;
      setLoadingMessage("Applying AI Motor Config...");
      setShowLoadingOverlay(true);
      try {
        const success = await storage.saveGestureMapping(
          `${recipe.recipe_name} (AI)`,
          recipe.motor_config,
          true,
        );
        if (success) showToast("AI Motor Config applied and saved!", "success");
        else showToast("Failed to apply AI config", "error");
      } finally {
        setShowLoadingOverlay(false);
      }
    },
    [storage, showToast],
  );

  // ── Save/Load Logic ──
  const handleSave = useCallback(
    async (name, isPublic = false) => {
      if (!auth.user) return showToast("Please log in to save", "info");
      if (!trainer.isTrained)
        return showToast("Train a model first", "warning");

      setShowLoadingOverlay(true);
      try {
        const saveHandler = tf.io.withSaveHandler(async (artifacts) => {
          const weightDataB64 = arrayBufferToBase64(artifacts.weightData);
          const success = await storage.saveModel(
            name,
            artifacts.modelTopology,
            artifacts.weightSpecs,
            weightDataB64,
            cm.classNames,
            { classes: cm.classes },
            aiRecipe,
            isPublic,
          );
          if (success) {
            showToast(`Model "${name}" saved!`, "success");
            refreshModels();
          } else {
            showToast("Failed to save", "error");
          }
        });
        await trainer.getModel().save(saveHandler);
      } catch (err) {
        console.error(err);
        showToast("Error saving model", "error");
      } finally {
        setShowLoadingOverlay(false);
      }
    },
    [
      trainer,
      storage,
      cm.classes,
      cm.classNames,
      showToast,
      auth,
      refreshModels,
    ],
  );

  const handleLoad = useCallback(
    async (name) => {
      if (!auth.user) return showToast("Please log in", "info");
      const modelItem = savedModels.find((m) => m.name === name);
      if (!modelItem) return showToast(`Model "${name}" not found`, "error");

      prediction.stopPredicting();
      setShowLoadingOverlay(true);
      setLoadingMessage("Loading model...");

      try {
        const modelData = await storage.loadModel(modelItem.id);
        if (modelData) {
          // Restore Classes
          const restoredClasses =
            modelData.dataset?.classes ||
            modelData.class_names.map((n) => ({ name: n, samples: [] }));
          cm.restoreClasses(restoredClasses);

          // Restore Model
          if (modelData.model_data) {
            const { modelTopology, weightSpecs, weightData } =
              modelData.model_data;
            const model = await tf.loadLayersModel(
              tf.io.fromMemory({
                modelTopology,
                weightSpecs,
                weightData: base64ToArrayBuffer(weightData),
              }),
            );
            trainer.setModel(model, modelData.class_names.length);

            // Restore AI Recipe if present
            if (modelData.ai_recipe) {
              setAiRecipe(modelData.ai_recipe);
            } else {
              setAiRecipe(null);
            }

            showToast(`Model loaded!`, "success");
            prediction.startPredicting();
          }
        }
      } catch (err) {
        console.error(err);
        showToast("Error loading model", "error");
      } finally {
        setShowLoadingOverlay(false);
      }
    },
    [storage, trainer, cm, prediction, showToast, auth, savedModels],
  );

  return (
    <div className="train-tab">
      {showLoadingOverlay && (
        <LoadingOverlay
          message={loadingMessage}
          progress={
            trainer.trainingProgress
              ? trainer.trainingProgress.epoch /
                trainer.trainingProgress.totalEpochs
              : null
          }
        />
      )}

      <div className="train-layout">
        {/* Left Panel */}
        <div className="train-left">
          <WebcamPanel
            onVideoReady={handleVideoReady}
            isDetecting={hand.isRunning}
            isStarted={isCameraStarted}
            onStartCamera={handleStartCamera}
            showVideo={hand.showVideo}
            onToggleVideo={hand.setShowVideo}
            error={hand.error}
          />
          <TrainingControls
            onAddClass={cm.addClass}
            onTrain={handleTrain}
            onReset={handleReset}
            onSave={handleSave}
            onLoad={handleLoad}
            savedModels={savedModels}
            hasEnoughData={cm.hasEnoughData}
            isTraining={trainer.isTraining}
            isTrained={trainer.isTrained}
            trainingProgress={trainer.trainingProgress}
            totalSamples={cm.totalSamples}
            numClasses={cm.classes.length}
          />
        </div>

        {/* Right Panel */}
        <div className="train-right">
          <div className="train-main-content">
            <div className="train-classes-header flex justify-between items-center mb-4">
              <h2 className="train-section-title mb-0">Gesture Classes</h2>
            </div>
            <div className="train-classes-list">
              {cm.classes.map((cls, index) => (
                <ClassCard
                  /* * FIX: Use cls.id if available, otherwise fallback to index.
                   * This prevents the 'coupling' bug if IDs are missing.
                   */
                  key={cls.id || index}
                  classData={cls}
                  onCollect={handleCollect}
                  onDeleteSample={cm.deleteSample}
                  onDelete={cm.deleteClass}
                  currentLandmarks={hand.currentLandmarks}
                />
              ))}
            </div>
          </div>

          <div className="train-predictions">
            <PredictionBars
              predictions={prediction.predictions}
              classNames={cm.classNames}
              threshold={prediction.confidenceThreshold}
            />
            <div className="ai-recipe-container mt-6">
              <AIRecipeCard
                recipe={aiRecipe}
                onClear={() => setAiRecipe(null)}
                user={auth.user}
                onApplyPiano={handleApplyPiano}
                onApplyMotors={handleApplyMotors}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
