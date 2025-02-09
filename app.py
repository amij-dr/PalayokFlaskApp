from flask import Flask, render_template, jsonify, redirect, url_for, session, request, send_from_directory
from functools import wraps
import json
import os

app = Flask(__name__, static_url_path='/static')

# ----------------------------------------------------------------------------------------------------#
# Loading data from JSON files

def load_ingredients():
    static_folder = os.path.join(app.root_path, 'static')
    json_file_path = os.path.join(static_folder, 'ingredients-cat.json')

    with open(json_file_path, 'r') as file:
        return json.load(file)

def load_recipes():
    try:
        static_folder = os.path.join(app.root_path, 'static')
        json_file_path = os.path.join(static_folder, 'recipes.json')
        
        with open(json_file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except (IOError, json.JSONDecodeError, UnicodeDecodeError) as e:
        print(f"Error loading recipes: {str(e)}")
        return []

# ----------------------------------------------------------------------------------------------------#
# Routes for the web application
@app.route('/')
@app.route('/home', methods=['GET'])
def home():
    ingredients_data = load_ingredients()
    return render_template('home.html', ingredient_categories=ingredients_data)

@app.route('/recipe-search', methods=['GET'])
def recipe_search():
    ingredients_data = load_ingredients()
    ingredients_query = request.args.get('ingredients', '')
    return render_template('recipe-search.html', 
                         ingredient_categories=ingredients_data,
                         pantry_ingredients=ingredients_query)

@app.route('/api/recipes', methods=['GET'])
def get_recipes():
    category = request.args.get('category')  
    recipes = load_recipes()
    if category:
        filtered_recipes = [recipe for recipe in recipes if category in recipe.get('category', [])]
        return jsonify(filtered_recipes)
    return jsonify(recipes)

@app.route('/recipe-details/<recipe_id>', methods=['GET'])
def recipe_details(recipe_id):
    recipes = load_recipes()
    recipe = next((r for r in recipes if r['id'] == recipe_id), None)
    
    if recipe is None:
        return redirect('/recipe-search')
        
    ingredients_data = load_ingredients()
    return render_template('recipe-details.html', 
                         recipe=recipe,
                         ingredient_categories=ingredients_data)

# ----------------------------------------------------------------------------------------------------#
# Saved recipes page - simplified to work with localStorage
@app.route('/saved-recipe', methods=['GET'])
def saved_recipe():
    ingredients_data = load_ingredients() 
    return render_template('saved-recipe.html', ingredient_categories=ingredients_data)

@app.route('/api/saved-recipes', methods=['GET'])
def get_saved_recipes():
    recipes = load_recipes()
    # The actual saved recipes filtering will happen on the client side using localStorage
    return jsonify(recipes), 200

@app.route('/profile')
def profile():
    ingredients_data = load_ingredients()
    return render_template('user-profile.html', user_data=None, ingredient_categories=ingredients_data)

@app.route('/about', methods=['GET'])
def about():
    ingredients_data = load_ingredients()
    return render_template('about.html', ingredient_categories=ingredients_data)

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    app.run(debug=True)