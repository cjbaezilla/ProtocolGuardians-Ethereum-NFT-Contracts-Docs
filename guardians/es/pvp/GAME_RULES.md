# Reglas del Juego Protocol Guardians PvP

## Visión General

¡Bienvenido a Protocol Guardians PvP! Esta guía explica las reglas, mecánicas y estrategias para batallas PvP competitivas.

## Modos de Batalla

### Batallas 1v1
- Una carta contra una carta
- Combate rápido
- Toma de decisiones rápida

### Batallas 3v3
- Equipo de 3 cartas
- Planificación estratégica de formaciones
- Batallas más largas

### Batallas 5v5
- Combate de equipo completo
- Máxima profundidad estratégica
- Batallas más gratificantes

## Registro

### Crear Tu Cuenta

1. Conecta tu wallet con NFTs ProtocolGuardians
2. Regístrate con un nombre de usuario único (1-32 caracteres)
3. Establece una URL de imagen de avatar (opcional)
4. Comienza con 1000 puntos de ELO

### Personalización de Perfil

- Actualiza la URL del avatar en cualquier momento
- El nombre de usuario es permanente (se elige una vez)
- El perfil está vinculado a la dirección de tu wallet

## Formaciones

### Configurar Tus Equipos

**Formaciones Máximas**: 3 formaciones guardadas (una por tipo de batalla)

**Cómo Establecer Formación**:
1. Selecciona el tipo de batalla (1v1, 3v3, o 5v5)
2. Elige NFTs de tu colección
3. Confirma la propiedad de todos los NFTs seleccionados
4. La formación se guarda y se bloquea cuando se usa en desafíos

**Reglas de Formación**:
- Los NFTs deben ser de tu propiedad
- No puedes usar NFTs en staking
- Formación bloqueada mientras el desafío esté pendiente
- Puedes modificar la formación cuando no esté en uso

**Restricciones**:
- No puedes cambiar la formación si es parte de un desafío pendiente
- Debes poseer todos los NFTs en la formación
- Los NFTs no deben estar en staking

## Desafíos

### Crear Desafíos

**Desafíos de Ranking**:
- Afecta tu puntuación ELO
- Cuesta 0.001 ETH de tarifa de desafío
- Debes especificar oponente y tipo de batalla
- Requiere stats firmadas para tus cartas

**Desafíos con Apuesta**:
- Incluye apuesta con tokens o ETH
- Cuesta 0.001 ETH de tarifa + cantidad de apuesta
- El oponente debe igualar la apuesta exactamente
- No afecta el ELO
- El ganador toma 97% del total (3% de tarifa del protocolo)

### Aceptar Desafíos

**Proceso**:
1. Recibe notificación de desafío
2. Revisa los términos propuestos por el oponente
3. Para desafíos con apuesta, verifica token y cantidad
4. Proporciona stats firmadas para tus cartas
5. Acepta o rechaza

**Requisitos de Aceptación**:
- Formaciones configuradas para el tipo de batalla
- Para desafíos con apuesta: Saldo suficiente para la apuesta
- Stats firmadas válidas para todas tus cartas

### Estados del Desafío

**Pendiente**: Desafío creado, esperando aceptación
**Aceptado**: Desafío aceptado, batalla lista para ejecutar
**Completado**: Batalla finalizada, recompensas distribuidas
**Cancelado**: Retador canceló, posibles penalizaciones aplican

### Cancelar Desafíos

**Quién Puede Cancelar**: Solo el retador

**Penalizaciones**:
- Desafío de ranking: Sin penalización (cancelación gratuita)
- Desafío con apuesta: 5% de la apuesta perdida al protocolo
- Sin pérdida de ELO o XP por cancelación

**Reembolsos**:
- Ranking: Tarifa de desafío reembolsada completamente
- Apuesta: 95% de la apuesta reembolsada

## Sistema de Combate

### Orden de Turnos

Las cartas atacan en orden de estadística de **Velocidad**:
- Mayor Velocidad = Ataca primero
- Misma Velocidad = Orden aleatorio
- Los equipos alternan turnos hasta que uno es derrotado

### Cálculo de Daño

**Fórmula Base**:
```
daño = atacante.power - (defensor.defense / 2)
daño_mínimo = 1
```

**Ventajas de Tipo**:
- Ventaja de tipo: +15% de bonificación de daño
- Desventaja de tipo: -15% de penalización de daño
- Sin ventaja: Daño normal

**Golpes Críticos**:
- Probabilidad = estadística_critico / 100
- Ejemplo: 250 crítico = 2.5% de probabilidad de crítico
- Los golpes críticos hacen 2x de daño

**Esquiva/Evasión**:
- Probabilidad = estadística_suerte / 100
- Ejemplo: 150 suerte = 1.5% de probabilidad de esquiva
- Esquiva exitosa = 0 de daño recibido

### Condiciones de Victoria

**Victoria**:
- Todas las cartas del oponente tienen HP ≤ 0
- Debes eliminar todo el equipo enemigo

**Límite de Turnos**:
- Máximo 50 turnos por batalla
- Después de 50 turnos, el equipo con más HP total gana
- Sin empates (siempre se determina un ganador)

### Tipos de Cartas

Hay 10 tipos de cartas con ventajas

**Ventajas de Tipo** (cada tipo vence a 2 tipos, débil contra 2 tipos):
- Tipo 0 vence a Tipos 1, 2 (débil contra 3, 4)
- Tipo 1 vence a Tipos 3, 4 (débil contra 5, 6)
- Tipo 2 vence a Tipos 5, 6 (débil contra 7, 8)
- ... (continúa el patrón)

## Sistema de Ranking ELO

### Puntuación Inicial

- ELO Inicial: **1000**
- ELO Mínimo: **0**
- Sin límite máximo

### Cambios de ELO

**Ganar Contra Mayor ELO**: +30 a +40 puntos
**Ganar Contra ELO Similar**: +20 a +30 puntos
**Ganar Contra Menor ELO**: +10 a +20 puntos

**Perder Contra Mayor ELO**: -10 a -20 puntos
**Perder Contra ELO Similar**: -20 a -30 puntos
**Perder Contra Menor ELO**: -30 a -40 puntos

### Cálculo de ELO

La fórmula se ajusta según la diferencia de ELO:
- Gran diferencia de habilidad = cambios de puntos menores
- Matchups cercanos = cambios de puntos mayores
- Previene el farmeo fácil de jugadores con ELO bajo

## XP y Niveles

### Ganancia de XP

**Después de Cada Batalla**:
- Ganador: **+50 XP**
- Perdedor: **+20 XP**
- Se aplica a batallas de ranking y con apuesta

### Progresión de Nivel

**Fórmula de Nivel**: Nivel = (XP / 100) + 1

**Ejemplos**:
- Nivel 1: 0-99 XP
- Nivel 2: 100-199 XP
- Nivel 3: 200-299 XP
- Nivel 10: 900-999 XP

**Beneficios de Nivel**:
- Los niveles no otorgan bonificaciones de combate directas
- Se usan para mostrar y matchmaking
- Indica experiencia general de batalla
- Sistema puro de prestigio

## Matchmaking

### Cómo Funciona

**Emparejamiento Automático**:
- Los jugadores con formaciones configuradas están automáticamente disponibles
- Busca oponentes en rango de ELO (±100 puntos)
- Devuelve hasta 10 oponentes elegibles
- Puedes desafiar a cualquiera en tu rango de ELO

**Rango de ELO**:
- Puedes buscar ±100 ELO desde tu calificación actual
- Previene desajustes abrumadores
- Fomenta batallas competitivas

## Sistema de Apuestas

### Tokens Soportados

**ETH Nativo**:
- Dirección cero (0x0)
- Tipo de apuesta más común
- Transferencia de valor directa

**Tokens ERC20**:
- Cualquier token ERC20 sin tarifas de transferencia
- Ambos jugadores deben usar el mismo token
- Debes aprobar el contrato por el monto
- Las ganancias se envían inmediatamente

### Reglas de Apuesta

**Requisitos de Apuesta**:
- Ambos jugadores apuestan la misma cantidad
- Ambos jugadores usan el mismo tipo de token
- El retador establece el monto, el oponente debe igualar exactamente
- No puedes aceptar desafíos parcialmente

**Distribución de Ganancias**:
- Ganador recibe: `(apuesta * 2) * 97%`
- Protocolo recibe: `(apuesta * 2) * 3%`
- Distribuido inmediatamente después de la batalla
- Sin demora o vesting

## Consejos de Juego

### Estrategia de Formación

1. **Equilibra Tu Equipo**: Mezcla alto daño, alta defensa y alta velocidad
2. **Cobertura de Tipos**: Incluye diferentes tipos de cartas para contrarrestar varios oponentes
3. **La Velocidad Importa**: Las cartas más rápidas atacan primero y más a menudo
4. **HP es Rey**: Sobrevive más tiempo para infligir más daño

### Consejos Ofensivos

- Alto Poder + Baja Defensa = Vidrio (alto riesgo, alta recompensa)
- Equilibra Poder y Defensa para consistencia
- La probabilidad de crítico agrega daño explosivo
- La Velocidad determina quién golpea primero

### Consejos Defensivos

- Alta Defensa reduce el daño entrante
- La Suerte te da oportunidades de esquivar completamente
- HP es tu recurso a gestionar
- Alta Defensa + Alto HP = Construcciones tanque

## Tarifas y Costos

### Tarifa de Creación de Desafío

- Fija: **0.001 ETH por desafío**
- Pagada por el retador
- No reembolsable a menos que el desafío expire
- Va al tesoro del protocolo

### Tarifas del Protocolo

**Tarifa de Apuesta**: **3% del total**
- Deducido de las ganancias
- Solo se aplica a batallas con apuesta
- Usado para desarrollo y mantenimiento del protocolo

## Restricciones

### Lo Que No Puedes Hacer

❌ Usar NFTs en staking en formaciones
❌ Desafiar con formaciones que no posees
❌ Aceptar desafíos sin formaciones configuradas
❌ Modificar formaciones mientras están en desafíos pendientes
❌ Cancelar el desafío de otra persona
❌ Usar tokens ERC20 con tarifas de transferencia para apuestas

## Juego Limpio

### Medidas Anti-Trampa

- Stats verificados mediante firmas criptográficas
- Propiedad de NFT verificada on-chain
- Resultados de batalla calculados determinísticamente
- Todas las batallas son transparentes y auditables

### Actividades Prohibidas

- Usar exploits de terceros
- Manipular stats (estadísticamente imposible debido a firmas)
- Colusión entre jugadores para resultados garantizados
- Desafíos automatizados con bots (contra términos de servicio)

## Glosario

**ELO**: Sistema de calificación para emparejamiento de habilidad de jugador
**Formación**: Configuración de equipo guardada para batallas
**Desafío**: Invitación a batalla de un jugador a otro
**Apuesta**: Sistema de apuestas con recompensas de tokens
**Stats**: Características de la carta (Poder, Defensa, Velocidad, HP, etc.)
**Ventaja de Tipo**: Sistema de ventaja tipo elemental
**Golpe Crítico**: Probabilidad aleatoria para 2x de daño
**Esquiva**: Probabilidad aleatoria de evitar completamente el daño
**Turno**: Ciclo de acción único en combate
**Gas**: Tarifa de transacción de Ethereum
