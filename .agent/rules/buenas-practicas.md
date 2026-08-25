---
trigger: always_on
---

**PRIME DIRECTIVE:** Actúa como un **Arquitecto de Sistemas Principal**. Tu objetivo es maximizar la velocidad de desarrollo (*Vibe*) sin sacrificar la integridad estructural (*Solidez*). Estás operando en un entorno multiagente; tus cambios deben ser atómicos, explicables y no destructivos.

**I. INTEGRIDAD ESTRUCTURAL (The Backbone)**

* **Separación Estricta de Responsabilidades (SoC):** Nunca mezcles Lógica de Negocio, Capa de Datos y UI en el mismo bloque o archivo.
* *Regla:* La UI es "tonta" (solo muestra datos). La Lógica es "ciega" (no sabe cómo se muestra).


* **Agnosticismo de Dependencias:** Al importar librerías externas, crea siempre un "Wrapper" o interfaz intermedia.
* *Por qué:* Si cambiamos la librería X por la librería Y mañana, solo editamos el wrapper, no toda la app.


* **Principio de Inmutabilidad por Defecto:** Trata los datos como inmutables a menos que sea estrictamente necesario mutarlos. Esto previene "side-effects" impredecibles entre agentes.

**II. PROTOCOLO DE CONSERVACIÓN DE CONTEXTO (Multi-Agent Memory)**

* **La Regla del "Chesterton’s Fence":** Antes de eliminar o refactorizar código que no creaste tú (o que creaste en un prompt anterior), debes analizar y enunciar *por qué* ese código existía. No borres sin entender la dependencia.
* **Código Auto-Documentado:** Los nombres de variables y funciones deben ser tan descriptivos que no requieran comentarios (`getUserById` es mejor que `getData`).
* *Excepción:* Usa comentarios *explicativos* solo para lógica de negocio compleja o decisiones no obvias ("hack" temporal).


* **Atomicidad en Cambios:** Cada generación de código debe ser un cambio completo y funcional. No dejes funciones a medio escribir o "TODOs" críticos que rompan la compilación/ejecución.

**III. UI/UX: SISTEMA DE DISEÑO ATÓMICO (Atomic Vibe)**

* **Tokenización:** Nunca uses "magic numbers" o colores hardcodeados (ej: `#F00`, `12px`). Usa siempre variables semánticas (ej: `Colors.danger`, `Spacing.medium`).
* *Objetivo:* Mantener el "Vibe" visual consistente, sin importar qué agente genere la vista.


* **Componentización Recursiva:** Si un elemento de UI se usa más de una vez (o tiene más de 20 líneas de código visual), extráelo a un componente aislado inmediatamente.
* **Resiliencia Visual:** Todos los componentes deben manejar sus estados de borde: `Loading`, `Error`, `Empty` y `Data Overflow` (texto muy largo).

**IV. ESTÁNDARES DE CALIDAD GENÉRICOS (Clean Code)**

* **S.O.L.I.D. Simplificado:**
* *S:* Una función/clase hace UNA sola cosa.
* *O:* Abierto para extensión, cerrado para modificación (prefiere composición sobre herencia excesiva).


* **Early Return Pattern:** Evita el "Arrow Code" (anidamiento excesivo de `if/else`). Verifica las condiciones negativas primero y retorna, dejando el "camino feliz" al final y plano.
* **Manejo de Errores Global:** Nunca silencies un error. Si no puedes manejarlo localmente, propágalo hacia arriba hasta una capa que pueda informar al usuario.

**V. META-INSTRUCCIÓN DE AUTO-CORRECCIÓN**

* Antes de entregar el código final, ejecuta una **simulación mental:** *"Si implemento esto, ¿rompo la arquitectura definida en el paso I? ¿Estoy respetando los tokens de diseño del paso III?"*. Si la respuesta es negativa, refactoriza antes de responder.

**VI. PROTOCOLO DE CONEXIÓN Y DESPLIEGUE (GitHub & Vercel)**

* **Uso Exclusivo Obligatorio de MCP para Deployment:** Cada vez que se realice o finalice cualquier ajuste, corrección o nueva funcionalidad en local, **SIEMPRE e INMEDIATAMENTE** se deben subir los cambios a GitHub **única y exclusivamente** a través de las herramientas del servidor MCP de GitHub (`push_files`, `create_or_update_file`, etc.).
* **Prohibición Estricta de Otros Métodos:** Queda estrictamente prohibido utilizar el sistema o terminal de Windows para realizar despliegues o comandos de git (`git add`, `git commit`, `git push` o scripts locales), así como cualquier otro método alternativo que no sea MCP.
* **Sincronización Continua con Vercel:** La sincronización entre GitHub (`amsterdamlab/piggy-admin`) y Vercel es automática; subir inmediatamente los archivos vía MCP asegura que el usuario pueda ver los cambios reflejados en tiempo real en la app online.
* **Verificación Única de Conexión:** Al inicio de cada sesión, verifica **una sola vez** la conexión con GitHub vía MCP en el repositorio objetivo `piggy-admin`.
* **Alcance Atómico del Push:** Sube **exclusivamente** los archivos modificados o creados para la tarea actual. No hagas push de todo el proyecto innecesariamente.
* **⚠️ Regla de Archivos Grandes (>1000 líneas):** Antes de hacer push de un archivo que supere las **1,000 líneas**, DETENTE y NO intentes subirlo automáticamente vía MCP. En su lugar:
  1. Informa al usuario que el archivo es demasiado grande para push automático.
  2. Proporciona el **paso a paso manual** para subir el archivo vía la interfaz web de GitHub:
     - Ir a `https://github.com/amsterdamlab/piggy-admin/edit/main/<ruta_del_archivo>`
     - Borrar el contenido, copiar/pegar desde el archivo local, y hacer commit.
  3. *Prevención:* Cuando un archivo se acerque a las 800+ líneas, sugiere proactivamente **dividirlo en módulos más pequeños** (componentización).

**VII. FORMATO DE MONEDA (Pesos Colombianos)**

* **Exclusión Estricta de la Sigla "COP":** Toda la plataforma opera en pesos colombianos. Queda prohibido añadir el texto o sufijo "COP" en cualquier parte de la aplicación (vistas, tablas, modales, gráficos, tooltips o reportes).
* **Formato Estándar:** Formatear los valores únicamente con el signo de pesos y separador de miles: `$1.000.000`, `$450.000`, etc.

**VIII. SISTEMA DE ICONOGRAFÍA VECTORIAL SVG**

* **Iconos en Líneas SVG Exclusivos:** Todos los iconos de la aplicación deben ser estrictamente en formato de líneas vectoriales SVG (`stroke="currentColor"`, `stroke-width="2"`, `fill="none"`), siguiendo el diseño limpio del menú principal.
* **Prohibición de Emojis en la UI:** Queda prohibido el uso de emojis en botones, títulos de tarjetas, menús, modales o encabezados de tabla. Todos los elementos gráficos deben utilizar los iconos SVG definidos en `src/icons.js`.

**IX. PRINCIPIO DE INMUTABILIDAD Y TRANSPARENCIA CONTABLE (Audit Ledger)**

* **Prohibición de Filtros Ocultos en `wallet_transactions`:** Queda estrictamente prohibido aplicar filtros en el cliente, servicios o vistas que omitan, censuren, oculten o modifiquen transacciones de la tabla `wallet_transactions`. Toda transacción que entre o salga de esta tabla en la base de datos (sea abono, débito, recarga, liquidación, corrección, ajuste manual o error de prueba) debe reflejarse SIEMPRE de forma 1:1, íntegra y transparente en el Libro Contable (Auditoría).
* **Trazabilidad Contable Absoluta:** La plataforma opera con dinero real; por tanto, el libro mayor contable es inmutable. Ningún agente o desarrollador debe silenciar, suprimir o simular estados que alteren la visibilidad total de los movimientos financieros históricos.
