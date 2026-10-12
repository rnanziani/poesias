-- Comprueba la carga. La primera consulta es la obra publicada.
-- La segunda es el pulso: al principio las cuentas están en cero.

SELECT titulo, fecha, slug
FROM escritos_publicos
ORDER BY fecha;

SELECT titulo, lecturas, gustos, me_detuvo, releer, compartiria
FROM pulso
ORDER BY fecha;
