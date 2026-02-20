import { useState } from 'react';
import { useEffect } from 'react';
import './App.css'


function App() {

  const [pokemons, setPokemons] = useState([]);

  useEffect(() => {
    const getPokemons = async () => {
      const res = await fetch("https://pokeapi.co/api/v2/pokemon/");
      const listPokemons = await res.json();
      const { results } = listPokemons;
      setPokemons(results);
    }


    getPokemons()
  }, []);

  return (
    <div>
      <h1>Pokedex</h1>
      {pokemons.map(pokemon => { <h3 key={pokemon.name}>{pokemon.name}</h3> }) }
  </div>
  )
};

export default App;
