import React from 'react';
import './AIRecipeCard.css';

export default function AIRecipeCard({ recipe, onClear, user }) {
    // Check if recipe exists and has the expected properties
    const hasRecipe = recipe && recipe.recipe_name;

    if (!hasRecipe) {
        return (
            <div className="ai-recipe-card ai-recipe-empty" data-testid="ai-recipe-card-empty">
                <div className="ai-recipe-header">
                    <h3>✨ AI Recipe</h3>
                </div>
                <p className="ai-recipe-description">
                    {user
                        ? "Train your model to generate an AI recipe!"
                        : "Log in to unlock AI recipe."
                    }
                </p>
                <div className="ai-recipe-placeholder-stats">
                    <div className="placeholder-stat-item">
                        <span className="stat-label">Status</span>
                        <span className="stat-value">{user ? "Waiting for Training" : "Login Required"}</span>
                    </div>
                </div>
            </div>
        );
    }

    console.log('Rendering AIRecipeCard with recipe:', recipe);

    return (
        <div className="ai-recipe-card" data-testid="ai-recipe-card">
            <div className="ai-recipe-header">
                <h3>✨ AI Gesture Recipe: {recipe.recipe_name}</h3>
                <button className="ai-recipe-close" onClick={onClear}>&times;</button>
            </div>
            <p className="ai-recipe-description">{recipe.description}</p>
            <div className="ai-recipe-use-cases">
                <h4>Suggested Use Cases:</h4>
                <ul>
                    {recipe.suggested_use_cases && recipe.suggested_use_cases.map((useCase, i) => (
                        <li key={i}>{useCase}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
