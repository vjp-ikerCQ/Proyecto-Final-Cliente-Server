# 🏰 Regnum Hollow - Proyecto Final Cliente-Servidor

¡Bienvenido a **Regnum Hollow**! Un juego táctico de cartas en un entorno de fantasía oscura medieval. La baraja española clásica cobra vida, donde cada palo posee sinergias únicas y cada rango representa un rol con habilidades oscuras y destructivas en el campo de batalla.

---

## 🚀 Requisitos e Instalación

Para poder jugar e instalar el proyecto de manera local, sigue los pasos detallados a continuación. Asegúrate de tener instalado [Node.js](https://nodejs.org/) (versión 16 o superior recomendado) y Git.

### 1. Clonar el repositorio
Abre una terminal y clona el proyecto con el siguiente comando:
```bash
git clone https://github.com/vjp-ikerCQ/Proyecto-Final-Cliente-Server.git
```

### 2. Instalación de Dependencias

El proyecto se divide en dos partes: **Frontend** (carpeta `/Regnum`) y **Backend** (carpeta `/Regnum/server`). Es necesario descargar los paquetes en ambas carpetas.

* **Frontend (Interfaz Gráfica / Cliente):**
  Abre una consola, navega a la carpeta `/Regnum` y ejecuta:
  ```bash
  cd Regnum
  npm install
  ```

* **Backend (Servidor / API):**
  En una consola diferente o navegando a la carpeta `/Regnum/server`, ejecuta:
  ```bash
  cd Regnum/server
  npm install
  ```

### 3. Ejecución del Proyecto

Para iniciar el juego completo, debes arrancar tanto el frontend como el backend de forma simultánea. Abre dos terminales independientes y ejecuta en cada una el comando de desarrollo:

* **En la consola del Frontend (`/Regnum`):**
  ```bash
  npm run dev
  ```
  *(Por defecto se levantará en el puerto 5173: `http://localhost:5173`)*

* **En la consola del Backend (`/Regnum/server`):**
  ```bash
  npm run dev
  ```
  *(Por defecto se levantará en el puerto 5000 utilizando nodemon: `http://localhost:5000`)*

---

## ⚔️ ¿Sobre qué va Regnum Hollow?

**Regnum Hollow** es un duelo de estrategia y cartas coleccionables para dos jugadores (jugador vs. inteligencia artificial/bot). El tablero consta de **3 columnas o carriles** donde desplegarás tus cartas de la baraja española. El objetivo principal es reducir los puntos de vida del rival (HP) a **0**. Ambos jugadores comienzan con **30 HP** y una reserva inicial de **10 puntos de Voluntad**.

---

## 🎮 Mecánicas de Juego

> [!NOTE]
> Regnum Hollow combina el azar de la baraja española con mecánicas profundas de posicionamiento, apilamiento (escalera) y administración de recursos.

### 🔮 1. Recursos: La Voluntad
* Cada acción importante consume **Voluntad** (tu maná o recurso).
* **Robar una carta** de tu mazo a la mano cuesta **1 de Voluntad**.
* **Atacar** cuesta una cantidad de Voluntad equivalente al coste de la carta atacante (solo para el primer ataque del turno de esa carta).
* Al final de tu turno, recuperas automáticamente **2 de Voluntad** (hasta un máximo de 10).

### 🃏 2. Mazo y Mano
* El mazo es compartido y se baraja al inicio de la partida.
* Empiezas con una mano de **3 cartas**. La mano máxima permitida es de **5 cartas**.
* **Pila de descartes (Descarte):** Puedes descartar de manera gratuita **1 carta de tu mano por ronda** para enviarla al descarte.
* **Penalización por mazo vacío:** Si el mazo se agota, las cartas del cementerio/descarte se rebarajan para formar el nuevo mazo, pero **ambos jugadores reciben 5 puntos de daño** como penalización por el desgaste de la batalla.

### 🛡️ 3. Las 3 Columnas y Movilidad
* El tablero consta de **3 columnas**.
* La mayoría de las cartas solo pueden atacar a la carta rival que esté situada en su **misma columna** (a menos que tengan roles tácticos o de ataque a distancia como el Asesino, Tirador, Mago, etc.).
* El **Caballo (Rank 11)** introduce la mecánica de movilidad, pudiendo desplazarse a columnas contiguas de manera gratuita e incluso intercambiarse de sitio con otra carta aliada.

### 🪜 4. Mecánica de Escalera (Apilamiento)
* En lugar de colocar una carta en un espacio vacío, puedes jugar una carta del rango **X** encima de una carta del rango **X-1** del mismo carril (ej. colocar un 3 sobre un 2).
* Al hacer esto, creas un **Apilamiento de Escalera**.
* La carta superior gana un **Bonus de Escalera**: **+1 de Daño (ATK)** por cada carta que tenga apilada debajo de ella.

### ✨ 5. Sinergias de Palo
Si logras llenar tus **3 columnas** con cartas del mismo palo de la baraja, desbloquearás un efecto pasivo global sumamente poderoso:

| Palo | Sinergia Activa (3 columnas llenas del mismo palo) |
| :---: | :--- |
| **⚔️ Espadas** | **Filo Cortante**: Todas tus cartas infligen **+1 de daño** al atacar. |
| **🪵 Bastos** | **Fuerte Muralla**: Resistencia física. Todas tus cartas reciben **-1 de daño** de los ataques rivales. |
| **🪙 Oros** | **Riqueza de Almas**: Ganas **+1 de Voluntad extra** al final de cada turno. |
| **🍷 Copas** | **Cáliz Sagrado**: Al final del turno, se **purgan los efectos negativos** (veneno y sangrado) y todas tus cartas se curan **+1 HP**. |

---

## 🎴 Roles y Rango de las Cartas

Cada carta posee un Rol en el juego según su número (Rango) de la baraja española. A continuación se detallan sus estadísticas de base y sus rasgos:

| Rango | Rol | Coste | HP | Tipo de Ataque | Habilidad / Efecto Especial |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **1** | **AS (Jefe)** | 5 | 10 | Especial / Área | Habilidades legendarias únicas por palo (ver más abajo). |
| **2** | **ASESINO** | 2 | 3 | Objetivo | Daño a la carta rival que elijas (ignora la restricción de columna). *Si es de Oros, recupera 1 de voluntad al atacar.* |
| **3** | **BESTIA** | 3 | 5 | Columna | Ataca estrictamente en su columna actual (Perro, Jabalí, Serpiente o Toro según el palo). |
| **4** | **TANQUE** | 4 | 12 | Objetivo | Mucha vida, ataque base bajo (2 ATK). *Si es de Oros, gana 1 de voluntad por cada golpe recibido.* |
| **5** | **CLÉRIGO** | 1 | 4 | Soporte | **Pasiva:** Otorga +1 de Voluntad al usuario al final de cada ronda. No puede atacar. |
| **6** | **CURANDERO** | 2 | 5 | Soporte | Cura 5 HP a una carta aliada. No puede atacar. *Si es de Oros, otorga +1 de Voluntad si cura por completo.* |
| **7** | **TIRADOR** | 4 | 4 | Perforar | Daña a la carta objetivo y al propio jugador rival al mismo tiempo. *Si es de Oros, otorga +2 de Voluntad si elimina a su objetivo.* |
| **8** | **PÍCARO** | 3 | 4 | Objetivo | Roba estadísticas al golpear: *Copas (Roba vida), Espadas (Doble daño siguiente golpe), Bastos (Roba defensa: reduce 1 daño recibido) y Oros (Roba 1 Voluntad).* |
| **9** | **MAGO** | 5 | 5 | Multiobjetivo | Puede atacar a 2 cartas rivales distintas a elegir en el mismo turno (puede atacar al jugador directamente si quedan menos de 2 cartas en juego). |
| **10** | **SOTA** | 5 | 6 | Táctico | Quita exactamente la mitad de vida (**50% HP**) a la carta rival seleccionada. |
| **11** | **CABALLO** | 6 | 8 | Movilidad | Ataque de columna. Puede moverse a un carril contiguo o atacar inmediatamente al entrar en juego sin coste adicional. |
| **12** | **REY** | 7 | 9 | Directo | Ataca directamente a la vida del jugador rival, ignorando las cartas enemigas del tablero. |

### 🐉 Habilidades Únicas de los Ases (Rango 1)
Los Ases son las cartas más poderosas del juego y cambian su habilidad drásticamente según el palo:
* **🐉 Dragón Rojo (As de Oros):** Lanza un ataque de fuego que hace 8 de daño en área y roba 2 de voluntad al rival.
* **👑 Gran Espadachín (As de Espadas):** Hace un devastador ataque físico en cruz de 9 de daño a múltiples cartas del rival.
* **🐍 Serpiente / Mujer de la Copa (As de Copas):** Envenena a las cartas enemigas (1 de daño por turno durante 3 turnos) y cura a tus aliados en mesa y a ti mismo.
* **👹 Troll de Maza (As de Bastos):** Inflige 7 de daño en área a las cartas del oponente y se envuelve en un escudo protector.

---

## 🃏 Los Comodines (Jokers)

En tu mazo existen **3 Jokers** especiales que cuestan **1 de Voluntad** y sirven para desbaratar las tácticas enemigas:

1. **Joker de Intercambio (Joker 1):** Selecciona 2 cartas de tu mano para intercambiarlas por 2 cartas aleatorias de la mano de tu oponente.
2. **Joker de Retorno (Joker 2):** Devuelve una carta de tu tablero a tu mano para salvarla de la muerte o recolocarla en el tablero. *(No se puede usar si forma parte de una escalera apilada)*.
3. **Joker de Resurrección (Joker 3):** Resucita una carta aliada aleatoria que se encuentre en la pila de descartes/cementerio y la devuelve a tu mano con toda su vida al máximo.

---

## 🛠️ Tecnologías

Este proyecto se ha desarrollado utilizando tecnologías web modernas:
* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion (para transiciones y animaciones fluidas).
* **Backend:** Node.js, Express, MongoDB (para base de datos y estadísticas), nodemon.
* **Internacionalización:** i18next (soporte multilenguaje).
* **Servicios de Imagen:** Cloudinary (almacenamiento y hosting de las ilustraciones de las cartas).

---

## 👥 Créditos y Autores

Este proyecto ha sido realizado por:
* **Pablo Serrano:** Desarrollo de la interfaz gráfica y Frontend.
* **Antonio Pérez:** Desarrollo del Backend y API.
* **Ismael Gil:** Modelos de Inteligencia Artificial para las ilustraciones de las cartas y apoyo general y supervisión en Frontend y Backend.
* **Iker Clemente:** Diseño y desarrollo de los sonidos, música de la aplicación y gestión de la nube. Supervisión general del proyecto, director general y control de versiones/ramas.

---

*Desarrollado como Proyecto Final Cliente-Servidor.*  
***"La baraja decidirá tu reino"***
