# Referencia de Fórmulas de Batalla

## Visión General

Este documento proporciona fórmulas y cálculos detallados utilizados en las batallas PvP de Protocol Guardians.

## Cálculo de Daño

### Fórmula de Daño Base

```
daño = atacante.power - (defensor.defense / 2)
```

**Daño Mínimo**: Siempre al menos 1 punto de daño

**Ejemplo**:
- Poder del Atacante: 500
- Defensa del Defensor: 200
- Daño: 500 - (200 / 2) = 400 de daño

### Modificador de Ventaja de Tipo

```
modificador_ventaja = 1.15  (para ventaja de tipo)
modificador_desventaja = 0.85  (para desventaja de tipo)
modificador_neutro = 1.0  (sin ventaja)
```

**Daño Final con Tipo**:
```
daño_final = daño_base * modificador_tipo
```

**Ejemplo**:
- Daño Base: 400
- Ventaja de Tipo: 400 * 1.15 = 460 de daño
- Desventaja de Tipo: 400 * 0.85 = 340 de daño

## Cálculo de Golpe Crítico

### Probabilidad de Golpe Crítico

```
probabilidad_critico = atacante.critical / 100  (porcentaje)
```

**Ejemplo**:
- Estadística Crítica: 250
- Probabilidad Crítica: 250 / 100 = 2.5%

### Daño de Golpe Crítico

```
daño_critico = daño_base * 2
```

**Ejemplo**:
- Daño Base: 400
- Daño Crítico: 400 * 2 = 800 de daño

## Cálculo de Esquiva/Evasión

### Probabilidad de Esquiva

```
probabilidad_esquiva = defensor.luck / 100  (porcentaje)
```

**Ejemplo**:
- Estadística de Suerte: 150
- Probabilidad de Esquiva: 150 / 100 = 1.5%

### Resultado de Esquiva

Si la esquiva es exitosa: Daño = 0
Si la esquiva falla: Se aplica daño normal

## Orden de Turnos

### Ordenamiento por Velocidad

Cartas ordenadas por estadística de Velocidad (mayor primero)

**Misma Velocidad**: Orden aleatorio

## Flujo Completo de Daño

### Cálculo Paso a Paso

1. **Verificar Esquiva**
   ```
   valor_aleatorio = random(0, 1000)
   si valor_aleatorio < defensor.luck:
       daño = 0  (el ataque falla)
       fin
   ```

2. **Calcular Daño Base**
   ```
   daño_base = max(atacante.power - (defensor.defense / 2), 1)
   ```

3. **Verificar Golpe Crítico**
   ```
   valor_aleatorio = random(0, 1000)
   si valor_aleatorio < atacante.critical:
       daño_base = daño_base * 2
   ```

4. **Aplicar Ventaja de Tipo**
   ```
   si tiene_ventaja_tipo:
       daño_base = daño_base * 1.15
   elif tiene_desventaja_tipo:
       daño_base = daño_base * 0.85
   ```

5. **Aplicar Daño al Defensor**
   ```
   defensor.hp = defensor.hp - daño_base
   ```

## Puntos de Salud (HP)

### HP Inicial

HP es una estadística de la carta desde metadata, inmutable por NFT.

### Reducción de HP

```
hp_actual = hp_actual - daño_final
```

### Condición de Muerte

```
si hp_actual <= 0:
    carta está derrotada
```

## Sistema de Tipos

### Ventajas de Tipo (10 tipos)

Cada tipo vence a 2 tipos y es débil contra 2 tipos:

- **Tipo 0** vence a Tipos 1, 2 (débil contra 3, 4)
- **Tipo 1** vence a Tipos 3, 4 (débil contra 5, 6)
- **Tipo 2** vence a Tipos 5, 6 (débil contra 7, 8)
- **Tipo 3** vence a Tipos 7, 8 (débil contra 9, 0)
- **Tipo 4** vence a Tipos 9, 0 (débil contra 1, 2)
- **Tipo 5** vence a Tipos 1, 2 (débil contra 3, 4)
- **Tipo 6** vence a Tipos 3, 4 (débil contra 5, 6)
- **Tipo 7** vence a Tipos 5, 6 (débil contra 7, 8)
- **Tipo 8** vence a Tipos 7, 8 (débil contra 9, 0)
- **Tipo 9** vence a Tipos 9, 0 (débil contra 1, 2)

### Verificar Ventaja de Tipo

```python
def tiene_ventaja_tipo(tipo_atacante, tipo_defensor):
    tipos_ganadores = VENTAJAS_TIPO[tipo_atacante]
    return tipo_defensor in tipos_ganadores
```

## Generación de Aleatoriedad

### Generación de Semilla

```
semilla = keccak256(block.timestamp || block.prevrandao || id_desafio)
```

### Generación de Número Aleatorio

```
valor_aleatorio = (semilla + indice_carta + numero_turno) % 1000
```

## Condiciones de Victoria

### Condición de Victoria

```
todas_cartas_oponente.hp <= 0
```

### Límite de Turnos

```
si turnos > 50:
    ganador = equipo_con_mas_hp_total()
```

### Cálculo de HP Total

```
hp_total_equipo = suma(todas_cartas.hp)
```

## Ejemplo de Cálculo de Batalla

### Configuración
- Carta A: Power=500, Defense=200, HP=1000, Speed=100, Critical=250, Luck=150, Type=0
- Carta B: Power=450, Defense=250, HP=1200, Speed=90, Critical=200, Luck=100, Type=1

### Turno 1: Carta A ataca a Carta B

1. **Verificación de Velocidad**: Carta A (100) > Carta B (90), Carta A ataca primero
2. **Verificación de Esquiva**: random(0,1000) = 300, Carta B luck=100, no esquiva (300 >= 100)
3. **Daño Base**: 500 - (250/2) = 375
4. **Verificación de Crítico**: random(0,1000) = 150, Carta A critical=250, ¡golpe crítico! (150 < 250)
5. **Daño Crítico**: 375 * 2 = 750
6. **Verificación de Tipo**: Tipo 0 vs Tipo 1, Tipo 0 tiene ventaja
7. **Daño Final**: 750 * 1.15 = 862.5 → 862
8. **Actualización de HP**: Carta B HP = 1200 - 862 = 338

### Turno 2: Carta B ataca a Carta A

1. **Verificación de Esquiva**: random(0,1000) = 200, Carta A luck=150, no esquiva
2. **Daño Base**: 450 - (200/2) = 350
3. **Verificación de Crítico**: random(0,1000) = 300, Carta B critical=200, no crítico
4. **Verificación de Tipo**: Tipo 1 vs Tipo 0, Tipo 1 tiene desventaja
5. **Daño Final**: 350 * 0.85 = 297.5 → 297
6. **Actualización de HP**: Carta A HP = 1000 - 297 = 703

## Cálculo de ELO

### Fórmula de Cambio de ELO

```
cambio_elo = cambio_base * (1 + (elo_oponente - mi_elo) / 400)
```

Donde:
- cambio_base = ±20 (depende de victoria/derrota)
- Diferencia mayor de ELO = cambios menores

**Ejemplo**:
- Mi ELO: 1200
- ELO del Oponente: 1000
- Yo gano: cambio_elo = 20 * (1 + (1000 - 1200) / 400) = 20 * 0.5 = 10 puntos ganados

## Cálculo de XP

### Recompensas de XP

```
xp_ganador = 50
xp_perdedor = 20
```

### Cálculo de Nivel

```
nivel = (xp_total / 100) + 1
```

## Propiedades Estadísticas

### Daño Esperado (Por Turno)

```
daño_esperado = daño_base * (1 + bonus_tipo) * (1 + probabilidad_critico)
```

Donde:
- bonus_tipo = 0.15 si ventaja, -0.15 si desventaja, 0 si neutral
- probabilidad_critico = atacante.critical / 100

### Supervivencia Esperada

```
turnos_esperados_para_matar = defensor.hp / daño_esperado
```

## Notas

- Todos los cálculos usan aritmética de enteros (redondeo hacia abajo)
- Los valores aleatorios son determinísticos por bloque
- Las estadísticas son inmutables desde la metadata del NFT
- Los resultados de batalla son determinísticos dados los mismos inputs
