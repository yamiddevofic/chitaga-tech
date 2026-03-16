/**
 * Configuración de formularios de sugerencias.
 *
 * Cada entrada define un "buzón" reutilizable.
 * Se identifica por `topic` y se puede usar en cualquier página
 * pasando el topic al componente.
 *
 * Para agregar un nuevo buzón:
 * 1. Agrega un objeto al array
 * 2. Usa el topic en tu página con el script de sugerencias
 */

export const suggestionTopics = [
    {
        topic: "reglas",
        label: "Reglas de la comunidad",
    },
    {
        topic: "general",
        label: "Sugerencias generales",
    },
    {
        topic: "eventos",
        label: "Eventos y talleres",
    },
];

export function isValidTopic(topic) {
    return suggestionTopics.some(t => t.topic === topic);
}
