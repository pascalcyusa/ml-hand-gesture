import React, { useState, useCallback } from "react";
import { XMarkIcon, MusicalNoteIcon, CogIcon, SparklesIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import "./AIRecipeCard.css";

export default function AIRecipeCard({
  recipe,
  onClear,
  user,
  onApplyPiano,
  onApplyMotors,
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpanded = useCallback((e) => {
    // Prevent toggle if clicking buttons
    if (e.target.closest('button')) return;
    setIsExpanded(prev => !prev);
  }, []);

  // Check if recipe exists and has the expected properties
  const hasRecipe = recipe && recipe.recipe_name;

  if (!hasRecipe) {
    return (
      <div
        className="ai-recipe-card ai-recipe-empty"
        data-testid="ai-recipe-card-empty"
      >
        <div className="ai-recipe-header">
          <h3>
            <SparklesIcon className="w-5 h-5 inline mr-2 text-[var(--gold)]" />
            AI Recipe
          </h3>
        </div>
        <p className="ai-recipe-description">
          {user
            ? "Train your model to generate an AI recipe!"
            : "Log in to unlock AI recipe."}
        </p>
        <div className="ai-recipe-placeholder-stats">
          <div className="placeholder-stat-item">
            <span className="stat-label">Status</span>
            <span className="stat-value">
              {user ? "Waiting for Training" : "Login Required"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ai-recipe-card ${isExpanded ? 'is-expanded' : ''}`} data-testid="ai-recipe-card">
      <div className="ai-recipe-header" onClick={toggleExpanded} style={{ cursor: 'pointer' }}>
        <h3>
          <SparklesIcon className="w-5 h-5 inline mr-2 text-[var(--gold)]" />
          AI Recipe: {recipe.recipe_name}
        </h3>
        
        <div className="ai-recipe-header-actions">
          <button 
            className="ai-recipe-close" 
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }} 
            title="Close Recipe"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          
          <div className="ai-recipe-chevron-wrapper">
            <ChevronDownIcon
              className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </div>

      <div className="ai-recipe-body">
        {recipe.ml_feedback && (
          <div className="ai-recipe-feedback">
            <strong>Coach Feedback</strong>
            <p>{recipe.ml_feedback}</p>
          </div>
        )}

        <p className="ai-recipe-description">{recipe.description}</p>

        <div className="ai-recipe-use-cases">
          <h4>Suggested Use Cases:</h4>
          <ul>
            {recipe.suggested_use_cases &&
              recipe.suggested_use_cases.map((useCase, i) => (
                <li key={i}>{useCase}</li>
              ))}
          </ul>
        </div>

        <div className="ai-recipe-actions">
          {recipe.piano_config && (
            <button
              className="ai-btn ai-btn-piano"
              onClick={() => onApplyPiano(recipe)}
              title="Auto-configure the piano with these gestures"
            >
              <MusicalNoteIcon className="h-5 w-5" />
              Apply Piano Config
            </button>
          )}
          {recipe.motor_config && (
            <button
              className="ai-btn ai-btn-motors"
              onClick={() => onApplyMotors(recipe)}
              title="Auto-configure motors with these gestures"
            >
              <CogIcon className="h-5 w-5" />
              Apply Motor Config
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
