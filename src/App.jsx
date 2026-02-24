import { useState, useEffect, useCallback } from 'react';
import Logo from '../src/assets/pokeapi_256.png';
import './App.css'

// Tipos de pokémon con sus colores
const typeColors = {
  normal: 'bg-gray-400',
  fire: 'bg-red-500',
  water: 'bg-blue-500',
  grass: 'bg-green-500',
  electric: 'bg-yellow-400',
  ice: 'bg-cyan-400',
  fighting: 'bg-orange-700',
  poison: 'bg-purple-500',
  ground: 'bg-amber-700',
  flying: 'bg-sky-400',
  psychic: 'bg-pink-500',
  bug: 'bg-lime-600',
  rock: 'bg-slate-600',
  ghost: 'bg-indigo-600',
  dragon: 'bg-indigo-700',
  dark: 'bg-slate-800',
  steel: 'bg-slate-400',
  fairy: 'bg-fuchsia-400',
};

function App() {

  const [pokemons, setPokemons] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [pokemonDetails, setPokemonDetails] = useState({});
  const cache = new Map();

  const getPokemonDetails = useCallback(async (pokemon) => {
    if (cache.has(pokemon.name)) {
      return cache.get(pokemon.name);
    }

    try {
      const [pokeRes, speciesRes] = await Promise.all([
        fetch(pokemon.url),
        fetch(pokemon.url.replace('/pokemon/', '/pokemon-species/'))
      ]);
      
      const [poke, species] = await Promise.all([
        pokeRes.json(),
        speciesRes.json()
      ]);
      
      const description = species.flavor_text_entries.find(entry => entry.language.name === 'en')?.flavor_text || 'Sin descripción';
      
      let evolutionChain = [];
      if (species.evolution_chain) {
        const evolutionRes = await fetch(species.evolution_chain.url);
        const evolution = await evolutionRes.json();
        
        const getEvolutions = async (chain) => {
          const pokemonRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${chain.species.name}`);
          const pokemonData = await pokemonRes.json();
          evolutionChain.push({
            name: chain.species.name,
            img: pokemonData.sprites.other.dream_world.front_default || pokemonData.sprites.front_default
          });
          if (chain.evolves_to.length > 0) {
            for (const next of chain.evolves_to) {
              await getEvolutions(next);
            }
          }
        };
        await getEvolutions(evolution.chain);
      }
      
      const details = {
        id: poke.id,
        name: poke.name,
        img: poke.sprites.other.dream_world.front_default,
        type: poke.types,
        height: poke.height,
        weight: poke.weight,
        stats: poke.stats,
        description: description.replace(/\f/g, ' '),
        evolutionChain: evolutionChain,
      };
      
      cache.set(pokemon.name, details);
      return details;
    } catch (error) {
      console.error('Error fetching pokemon details:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const getPokemons = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=151&offset=0");
        const listPokemons = await res.json();
        const { results } = listPokemons;
        
        const pokemonsWithTypes = await Promise.all(results.map(async (pokemon) => {
          const res = await fetch(pokemon.url);
          const poke = await res.json();
          return {
            name: pokemon.name,
            url: pokemon.url,
            id: parseInt(pokemon.url.split('/').slice(-2, -1)[0]),
            types: poke.types
          };
        }));
        
        setPokemons(pokemonsWithTypes);
      } catch (error) {
        console.error('Error fetching pokemons:', error);
      } finally {
        setLoading(false);
      }
    };

    getPokemons();
  }, []);

  // Función para manejar la selección de tipos
  const toggleTypeFilter = (type) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else if (prev.length < 2) {
        return [...prev, type];
      }
      return prev;
    });
  };

  const handlePokemonClick = async (pokemon) => {
    setSelectedPokemon(pokemon);
    
    if (!pokemonDetails[pokemon.name]) {
      setLoadingDetails(true);
      const details = await getPokemonDetails(pokemon);
      if (details) {
        setPokemonDetails(prev => ({
          ...prev,
          [pokemon.name]: details
        }));
      }
      setLoadingDetails(false);
    }
  };

  // Obtener todos los tipos únicos
  const allTypes = [...new Set(pokemons.flatMap(p => p.types?.map(t => t.type.name) || []))].sort();

  return (
    <div className='pokemon-background flex flex-col justify-center items-center'>
      <img className='mt-14 w-3/4 sm:w-2/3 md:w-1/2 lg:w-2/5 xl:w-1/3 h-auto' src={Logo} alt="LogoIMG" />
      <div className='mx-auto relative inline-block'>
        <input className='border border-black rounded-lg p-2 m-20 pr-12 w-80' type="text" placeholder='Search your Pokemon here...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
        <button className='absolute right-6 top-1/2 transform -translate-y-1/2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg'>
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
          </svg>
        </button>
      </div>
      <p className='text-gray-600 text-lg font-sans mb-2 font-medium'>Filter by type (maximum 2 selections):</p>
      <div className='flex flex-wrap gap-2 justify-center mb-16 px-4 w-full max-w-4xl'>
        {allTypes.map(type => (
          <button
            key={type}
            onClick={() => toggleTypeFilter(type)}
            className={`${typeColors[type]} text-white px-4 py-2 rounded-lg text-sm font-semibold uppercase transition-all duration-200 border ${
              selectedTypes.includes(type) 
                ? 'border-black shadow-lg scale-105' 
                : 'border-transparent hover:shadow-md'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
      {loading ? (
        <div className='flex justify-center items-center h-64'>
          <div className='text-xl font-semibold'>Cargando Pokémon...</div>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 flex-wrap text-center justify-center'>
        {pokemons.filter(pokemon => {
          const matchesSearch = pokemon.name.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesTypes = selectedTypes.length === 0 || selectedTypes.every(selectedType => pokemon.types?.some(t => t.type.name === selectedType));
          return matchesSearch && matchesTypes;
        }).map(pokemon => {
          const pokemonDetail = pokemonDetails[pokemon.name];
          return (
            <div className='border border-black bg-slate-300 my-12 mx-2 p-4 w-48 relative rounded-lg min-w-[250px] cursor-pointer hover:shadow-lg transition-shadow'
              key={pokemon.id}
              onClick={() => handlePokemonClick(pokemon)}
              >
              <img className='size-36 absolute left-0 right-0 bottom-0 top-[-100px] mx-auto'
                src={pokemonDetail?.img || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`} alt={pokemon.name} />
              <div className='flex flex-col justify-center items-center mt-5'>
                <span>#{String(pokemon.id).padStart(2, '0')} - {pokemon.name.toUpperCase()}</span>
                <div className='flex flex-row gap-2 mt-2'>
                  <span className={`type-badge ${typeColors[pokemon.types[0].type.name]} text-white px-3 py-1 rounded-lg text-sm font-semibold uppercase border border-black shadow-sm`}>{pokemon.types[0].type.name}</span>
                  {pokemon.types[1] && <span className={`type-badge ${typeColors[pokemon.types[1].type.name]} text-white px-3 py-1 rounded-lg text-sm font-semibold uppercase border border-black shadow-sm`}>{pokemon.types[1].type.name}</span>}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {selectedPokemon && (
        <div className='modal-overlay fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ease-in-out' onClick={() => setSelectedPokemon(null)}>
          <aside className='fixed right-0 top-0 h-full w-96 bg-white shadow-2xl overflow-y-auto z-50 transition-transform duration-300 ease-in-out' onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedPokemon(null)}
              className='absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg'
              aria-label='Cerrar modal'
            >
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
            
            {loadingDetails ? (
              <div className='flex justify-center items-center h-64'>
                <div className='text-lg font-semibold'>Cargando detalles...</div>
              </div>
            ) : pokemonDetails[selectedPokemon.name] ? (
              <>
                <header className='p-8 pt-16'>
                  <img 
                    src={pokemonDetails[selectedPokemon.name].img} 
                    alt={selectedPokemon.name}
                    className='w-64 h-64 mx-auto mb-6'
                  />
                  <h2 className='text-3xl font-bold text-center mb-2'>{selectedPokemon.name.toUpperCase()}</h2>
                  <p className='text-center text-gray-600 mb-6'>#{String(pokemonDetails[selectedPokemon.name].id).padStart(2, '0')}</p>
                </header>

                <article className='px-8 pb-8'>
                  <section className='mb-6'>
                    <h3 className='font-bold text-lg mb-2'>Descripción</h3>
                    <p className='text-sm text-gray-700 leading-relaxed'>{pokemonDetails[selectedPokemon.name].description}</p>
                  </section>

                  <section className='mb-6'>
                    <h3 className='font-bold text-lg mb-2'>Tipos</h3>
                    <nav className='flex gap-2 flex-wrap'>
                      <span className={`type-badge ${typeColors[pokemonDetails[selectedPokemon.name].type[0].type.name]} text-white px-4 py-2 rounded-lg font-semibold uppercase border border-black`}>
                        {pokemonDetails[selectedPokemon.name].type[0].type.name}
                      </span>
                      {pokemonDetails[selectedPokemon.name].type[1] && (
                        <span className={`type-badge ${typeColors[pokemonDetails[selectedPokemon.name].type[1].type.name]} text-white px-4 py-2 rounded-lg font-semibold uppercase border border-black`}>
                          {pokemonDetails[selectedPokemon.name].type[1].type.name}
                        </span>
                      )}
                    </nav>
                  </section>

                  <section className='mb-6'>
                    <h3 className='font-bold text-lg mb-2'>Características</h3>
                    <dl className='space-y-2'>
                      <div className='flex justify-between'>
                        <dt className='font-semibold'>Altura:</dt>
                        <dd>{(pokemonDetails[selectedPokemon.name].height / 10).toFixed(1)} m</dd>
                      </div>
                      <div className='flex justify-between'>
                        <dt className='font-semibold'>Peso:</dt>
                        <dd>{(pokemonDetails[selectedPokemon.name].weight / 10).toFixed(1)} kg</dd>
                      </div>
                    </dl>
                  </section>

                  <section className='mb-6'>
                    <h3 className='font-bold text-lg mb-2'>Estadísticas</h3>
                    <div className='space-y-3'>
                      {pokemonDetails[selectedPokemon.name].stats.map((stat) => (
                        <div key={stat.stat.name}>
                          <div className='flex justify-between mb-1'>
                            <span className='text-sm font-semibold capitalize'>{stat.stat.name}</span>
                            <span className='text-sm font-semibold'>{stat.base_stat}</span>
                          </div>
                          <div className='w-full bg-gray-200 rounded-full h-2'>
                            <div 
                              className='bg-blue-500 h-2 rounded-full' 
                              style={{width: `${(stat.base_stat / 150) * 100}%`}}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {pokemonDetails[selectedPokemon.name].evolutionChain && pokemonDetails[selectedPokemon.name].evolutionChain.length > 1 && (
                    <section className='mb-6'>
                      <h3 className='font-bold text-lg mb-2'>Cadena Evolutiva</h3>
                      <div className='flex items-center gap-1 flex-wrap justify-center'>
                        {pokemonDetails[selectedPokemon.name].evolutionChain.map((pokemon, index) => (
                          <div key={pokemon.name} className='flex items-center'>
                            <div className='flex flex-col items-center'>
                              <img 
                                src={pokemon.img} 
                                alt={pokemon.name}
                                className='w-16 h-16'
                              />
                              <span className='text-xs font-semibold mt-1 uppercase'>{pokemon.name}</span>
                            </div>
                            {index < pokemonDetails[selectedPokemon.name].evolutionChain.length - 1 && (
                              <span className='mx-2 text-xl'>→</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </article>
              </>
            ) : null}
          </aside>
        </div>
      )}
    </div>
  )
};

export default App;