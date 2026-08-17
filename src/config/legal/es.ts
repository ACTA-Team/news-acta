import { siteConfig } from '@/config/site';
import type { LegalCopy } from './types';

/**
 * ============================================================================
 * TRANSLATION REVIEW REQUIRED BEFORE PUBLISHING
 *
 * This is a human translation of the English terms and privacy policy, written
 * to mirror the original section by section. It has NOT been reviewed by
 * counsel. Legal copy is the one place on this site where an approximate
 * translation is a liability rather than an inconvenience: consumer protection
 * and data protection wording is jurisdiction specific, and the governing law
 * clause in particular reads differently to a Costa Rican or Spanish reader than
 * to a Californian one.
 *
 * Before this ships to production, someone qualified must confirm:
 *   - section 11 of the terms (governing law and venue) is enforceable and
 *     correctly worded for the Spanish speaking audiences ACTA serves
 *   - the GDPR and CCPA/CPRA summaries in the privacy policy use the accepted
 *     Spanish legal terminology, not a literal rendering of the English
 *   - the "as is" / "as available" disclaimers carry the same legal weight
 *
 * Until then, treat this file as a draft for review.
 * ============================================================================
 */

const siteHost = siteConfig.url.replace(/^https?:\/\//, '');

export const legalCopyEs: LegalCopy = {
  terms: {
    title: 'Términos del servicio',
    intro: [
      {
        type: 'p',
        text: `Estos Términos del servicio ("Términos") constituyen un acuerdo legal entre usted y ACTA ("ACTA", "nosotros" o "nuestro") en relación con su acceso y uso del sitio web ${siteConfig.name}, sus aplicaciones asociadas y los servicios relacionados (en conjunto, los "Servicios"). Si no está de acuerdo, no utilice los Servicios.`,
      },
      {
        type: 'p',
        text: 'Estos Términos describen derechos y obligaciones importantes. Le recomendamos leerlos con atención y, cuando corresponda, obtener asesoría legal independiente. Nada de lo aquí dispuesto crea una sociedad, una agencia ni una empresa conjunta.',
      },
    ],
    sections: [
      {
        heading: '1. Aceptación y cambios',
        blocks: [
          {
            type: 'p',
            text: 'Al crear una cuenta, acceder o utilizar los Servicios, usted acepta estos Términos y nuestra Política de privacidad. Podemos modificar estos Términos en cualquier momento. Publicaremos la versión actualizada en esta página y cambiaremos la fecha de "Última actualización". El uso continuado después de que los cambios entren en vigor constituye la aceptación de los Términos revisados. Si no está de acuerdo, debe dejar de utilizar los Servicios.',
          },
        ],
      },
      {
        heading: '2. Los Servicios',
        blocks: [
          {
            type: 'p',
            text: `${siteConfig.name} publica contenido editorial e informativo, incluidas noticias, artículos y resúmenes periódicos. Podemos añadir, modificar o descontinuar funciones, contenidos o integraciones. Los Servicios se ofrecen "tal cual" y "según disponibilidad", en la máxima medida permitida por la ley.`,
          },
        ],
      },
      {
        heading: '3. Requisitos de uso',
        blocks: [
          {
            type: 'p',
            text: 'Puede utilizar los Servicios únicamente si tiene capacidad para celebrar un contrato vinculante con ACTA conforme a la legislación aplicable. Si utiliza los Servicios en nombre de una organización, declara que cuenta con la autoridad para obligarla, y el término "usted" incluye a esa organización. No debe utilizar los Servicios si se lo impiden sanciones, normas de exportación u otras leyes aplicables.',
          },
        ],
      },
      {
        heading: '4. Cuentas y acceso',
        blocks: [
          {
            type: 'p',
            text: 'Algunas funciones pueden requerir una cuenta. Usted es responsable de mantener la confidencialidad de sus credenciales, de toda la actividad realizada desde su cuenta y de proporcionar información exacta. Debe notificarnos de inmediato cualquier uso no autorizado. Podemos suspender o cancelar el acceso si consideramos razonablemente que ha incumplido estos Términos, que representa un riesgo de seguridad o si la ley lo exige. Los flujos de autenticación (incluido el inicio de sesión mediante redes sociales) pueden ser prestados por terceros; su uso también está sujeto a los términos y políticas de esos terceros.',
          },
        ],
      },
      {
        heading: '5. Uso aceptable',
        blocks: [
          { type: 'p', text: 'Usted se compromete a no:' },
          {
            type: 'ul',
            items: [
              'Infringir ninguna ley, reglamento o derecho de terceros',
              'Intentar obtener acceso no autorizado a los Servicios, a los sistemas o a los datos de otras personas',
              'Interferir con los Servicios o interrumpirlos, incluso mediante la transmisión de programas maliciosos, correo no deseado o código dañino',
              'Extraer, indexar o recopilar datos de forma masiva sin nuestro consentimiento previo por escrito, cuando dicho uso esté prohibido',
              'Hacerse pasar por otra persona o entidad, ni tergiversar su afiliación',
              'Utilizar los Servicios para desarrollar un producto competidor o para aplicarles ingeniería inversa, salvo cuando dicha restricción no sea exigible conforme a la legislación aplicable',
            ],
          },
        ],
      },
      {
        heading: '6. Contenido y propiedad intelectual',
        blocks: [
          { type: 'h3', text: 'Nuestro contenido' },
          {
            type: 'p',
            text: 'Los textos, gráficos, logotipos y demás materiales que ACTA pone a disposición a través de los Servicios (con excepción del contenido de terceros o de personas usuarias, cuando así se indique) son propiedad de ACTA o de sus licenciantes y están protegidos por la legislación de derechos de autor, marcas y otras normas. No puede copiarlos, modificarlos, distribuirlos ni crear obras derivadas, salvo cuando lo autoricemos por escrito o cuando esté permitido para compartirlos mediante las funciones integradas del sitio (por ejemplo, enlaces y la consulta normal desde un navegador).',
          },
          { type: 'h3', text: 'Su contenido' },
          {
            type: 'p',
            text: 'Si nos envía contenido (por ejemplo, comentarios, contribuciones o materiales para publicación), concede a ACTA una licencia mundial, no exclusiva y libre de regalías para usar, alojar, reproducir, modificar, mostrar y distribuir ese contenido con el fin de operar, promocionar y mejorar los Servicios. Usted declara que cuenta con los derechos necesarios para otorgar esta licencia. Conserva la titularidad de su contenido, sujeta a la licencia anterior.',
          },
        ],
      },
      {
        heading: '7. Enlaces y servicios de terceros',
        blocks: [
          {
            type: 'p',
            text: 'Los Servicios pueden enlazar o integrar sitios, servicios o contenidos de terceros. No los controlamos ni somos responsables de ellos. El uso de servicios de terceros es a su propio riesgo y está sujeto a los términos y prácticas de privacidad de esos terceros.',
          },
        ],
      },
      {
        heading: '8. Exclusión de garantías',
        blocks: [
          {
            type: 'p',
            text: 'LOS SERVICIOS Y TODO SU CONTENIDO SE OFRECEN "TAL CUAL" Y "SEGÚN DISPONIBILIDAD", SIN GARANTÍAS DE NINGÚN TIPO, YA SEAN EXPRESAS, IMPLÍCITAS O LEGALES, INCLUIDAS LAS GARANTÍAS DE COMERCIABILIDAD, IDONEIDAD PARA UN FIN DETERMINADO, TITULARIDAD Y NO INFRACCIÓN. ACTA NO GARANTIZA QUE LOS SERVICIOS FUNCIONEN SIN INTERRUPCIONES, SIN ERRORES NI LIBRES DE COMPONENTES DAÑINOS. EL CONTENIDO EDITORIAL TIENE FINES INFORMATIVOS; NO CONSTITUYE ASESORÍA LEGAL, FINANCIERA, DE INVERSIÓN NI PROFESIONAL.',
          },
        ],
      },
      {
        heading: '9. Limitación de responsabilidad',
        blocks: [
          {
            type: 'p',
            text: 'EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEGISLACIÓN APLICABLE, EN NINGÚN CASO ACTA, SUS FILIALES, DIRECTIVOS, ADMINISTRADORES, EMPLEADOS O AGENTES SERÁN RESPONSABLES POR DAÑOS INDIRECTOS, INCIDENTALES, ESPECIALES, CONSECUENTES O PUNITIVOS, NI POR PÉRDIDA DE BENEFICIOS, DATOS, REPUTACIÓN U OPORTUNIDADES DE NEGOCIO, DERIVADOS O RELACIONADOS CON SU USO DE LOS SERVICIOS, SEA POR RESPONSABILIDAD CONTRACTUAL, EXTRACONTRACTUAL O DE OTRO TIPO, INCLUSO SI SE NOS HUBIERA ADVERTIDO DE LA POSIBILIDAD DE TALES DAÑOS.',
          },
          {
            type: 'p',
            text: 'NUESTRA RESPONSABILIDAD TOTAL POR CUALQUIER RECLAMACIÓN DERIVADA O RELACIONADA CON LOS SERVICIOS O CON ESTOS TÉRMINOS NO EXCEDERÁ LA MAYOR DE LAS SIGUIENTES CANTIDADES: (A) EL IMPORTE QUE NOS HAYA PAGADO POR LOS SERVICIOS DURANTE LOS DOCE (12) MESES ANTERIORES A LA RECLAMACIÓN, O (B) CINCUENTA DÓLARES DE LOS ESTADOS UNIDOS (US $50.00), SI LOS SERVICIOS FUERON DE USO GRATUITO. ALGUNAS JURISDICCIONES NO PERMITEN CIERTAS LIMITACIONES; EN ESAS JURISDICCIONES, NUESTRA RESPONSABILIDAD SE LIMITA EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY.',
          },
        ],
      },
      {
        heading: '10. Indemnización',
        blocks: [
          {
            type: 'p',
            text: 'Usted defenderá, indemnizará y mantendrá indemne a ACTA y a sus filiales, directivos, administradores y empleados frente a cualquier reclamación, daño, pérdida o gasto (incluidos honorarios razonables de abogados) que se derive de su uso de los Servicios, de su contenido o del incumplimiento de estos Términos o de la legislación aplicable, salvo en la medida en que se deba a nuestra negligencia grave o dolo.',
          },
        ],
      },
      {
        heading: '11. Legislación aplicable y resolución de controversias',
        blocks: [
          {
            type: 'p',
            text: 'Estos Términos se rigen por las leyes del Estado de California y de los Estados Unidos, sin atender a las normas sobre conflicto de leyes. No se aplica la Convención de las Naciones Unidas sobre los Contratos de Compraventa Internacional de Mercaderías. Sujeto a la legislación aplicable, la jurisdicción y el foro exclusivos para las controversias derivadas de estos Términos o de los Servicios serán los tribunales estatales y federales del condado de San Francisco, California, y usted acepta someterse a la jurisdicción personal de esos tribunales. Si usted es consumidor, las protecciones obligatorias en materia de consumo de su país de residencia pueden seguir siendo aplicables; nada en esta sección limita esos derechos.',
          },
        ],
      },
      {
        heading: '12. Disposiciones generales',
        blocks: [
          {
            type: 'p',
            text: 'Estos Términos, junto con nuestra Política de privacidad, constituyen el acuerdo íntegro entre usted y ACTA en relación con los Servicios. Si alguna disposición se declara inválida, el resto continuará en vigor. El hecho de que no ejerzamos un derecho no constituye una renuncia a él. Usted no puede cederlos sin nuestro consentimiento; nosotros podemos cederlos en el marco de una fusión, adquisición o venta de activos. Los títulos de las secciones se incluyen únicamente por comodidad.',
          },
        ],
      },
      {
        heading: '13. Contacto',
        blocks: [
          {
            type: 'p',
            text: 'Si tiene preguntas sobre estos Términos, contáctenos a través de los canales indicados en nuestro sitio web en [acta.build](https://acta.build).',
          },
        ],
      },
    ],
  },

  privacy: {
    title: 'Política de privacidad',
    intro: [
      {
        type: 'p',
        text: `Esta Política de privacidad explica cómo ACTA ("nosotros" o "nuestro") trata la información personal cuando usted visita, utiliza o interactúa con ${siteConfig.name} y los servicios relacionados (los "Servicios"), incluido el sitio [${siteHost}](${siteConfig.url}). Al utilizar los Servicios, acepta las prácticas descritas aquí. Si no está de acuerdo, le pedimos que no utilice los Servicios.`,
      },
      {
        type: 'p',
        text: 'Tratamos la información personal conforme a la legislación de protección de datos aplicable. Según su ubicación, puede contar con derechos específicos, que se resumen más abajo.',
      },
    ],
    sections: [
      {
        heading: '1. Quiénes somos',
        blocks: [
          {
            type: 'p',
            text: 'ACTA opera los Servicios en relación con su ecosistema de productos y sus comunicaciones públicas. Para los fines del Reglamento General de Protección de Datos de la UE y del Reino Unido ("RGPD"), ACTA es normalmente el responsable del tratamiento de la información personal cuyos fines y medios determina para los Servicios, salvo que un acuerdo aparte disponga lo contrario. Datos de contacto: véase la sección 12.',
          },
        ],
      },
      {
        heading: '2. Información que recopilamos',
        blocks: [
          { type: 'h3', text: '2.1 Información que usted nos proporciona' },
          {
            type: 'ul',
            items: [
              'Datos de cuenta y autenticación, como la dirección de correo electrónico, el nombre y el método de inicio de sesión',
              'El contenido que nos envía (por ejemplo, propuestas editoriales, comentarios o mensajes de soporte) y sus metadatos asociados',
              'Las preferencias que configura (por ejemplo, de visualización o de comunicaciones) cuando las ofrecemos',
            ],
          },
          { type: 'h3', text: '2.2 Información recopilada automáticamente' },
          {
            type: 'ul',
            items: [
              'Datos de dispositivo y de registro, como la dirección IP, el tipo de navegador, el sistema operativo y las marcas de tiempo',
              'Datos de uso, como las páginas vistas, los enlaces en los que hace clic, las URL de referencia y los patrones generales de interacción',
              'Cookies y tecnologías similares (véase la sección 5), incluida la información necesaria para la seguridad, la continuidad de la sesión y la analítica, cuando esté habilitada',
            ],
          },
          { type: 'h3', text: '2.3 Información procedente de terceros' },
          {
            type: 'p',
            text: 'Si utiliza proveedores de inicio de sesión único o de redes sociales, podemos recibir un conjunto limitado de datos de esos proveedores según lo permitan su configuración y las políticas de dichos proveedores (por ejemplo, identificadores de perfil y correo electrónico). También podemos recibir información agregada o de contacto profesional de socios cuando la ley lo permita.',
          },
        ],
      },
      {
        heading: '3. Cómo utilizamos la información',
        blocks: [
          { type: 'p', text: 'Utilizamos la información personal para:' },
          {
            type: 'ul',
            items: [
              'Prestar, proteger y mejorar los Servicios, incluido su rendimiento y compatibilidad',
              'Autenticarle, gestionar su cuenta y enviarle comunicaciones relacionadas con el servicio',
              'Publicar, distribuir y promocionar contenido conforme a nuestros estándares editoriales y comunitarios',
              'Detectar, prevenir y atender fraudes, abusos, incidentes de seguridad y problemas técnicos',
              'Cumplir con la ley, con los procedimientos legales y con las obligaciones regulatorias',
              'Ejercer o defender reclamaciones legales',
              'Cuando la ley lo permita, enviarle novedades sobre los Servicios; puede darse de baja de las comunicaciones comerciales donde se ofrezca esa opción',
            ],
          },
          {
            type: 'p',
            text: '**Bases jurídicas (EEE y Reino Unido):** nos basamos en la ejecución de un contrato, en intereses legítimos (como mejorar la seguridad y la experiencia de uso, ponderados frente a sus derechos) y en el consentimiento cuando se requiere (por ejemplo, para cookies no esenciales, cuando corresponda). Tratamos la información en la medida necesaria para cumplir obligaciones legales. Cuando nos basamos en el consentimiento, puede retirarlo en cualquier momento.',
          },
        ],
      },
      {
        heading: '4. Cómo compartimos la información',
        blocks: [
          {
            type: 'p',
            text: 'No vendemos su información personal. Podemos compartirla de las siguientes formas:',
          },
          {
            type: 'ul',
            items: [
              '**Proveedores de servicios** que nos ayudan a alojar, operar, proteger y analizar los Servicios, sujetos a contratos que exigen garantías adecuadas',
              '**Asesores profesionales** (abogados, auditores) cuando sea necesario y bajo obligaciones de confidencialidad',
              '**Autoridades** cuando consideremos de buena fe que la divulgación es exigida por la ley o por un procedimiento legal, o necesaria para proteger los derechos, la seguridad o la propiedad de usted, de nosotros o de terceros',
              '**Operaciones societarias** en el marco de una fusión, adquisición, reorganización o venta de activos, con las protecciones adecuadas',
              '**Por indicación suya** (por ejemplo, cuando nos pide compartir contenido o integrarnos con un tercero que usted elige)',
            ],
          },
        ],
      },
      {
        heading: '5. Cookies y tecnologías similares',
        blocks: [
          {
            type: 'p',
            text: 'Nosotros y nuestros socios podemos utilizar cookies, almacenamiento local y tecnologías similares para funciones esenciales, preferencias y, cuando usted lo consienta o la ley lo permita, analítica. Puede controlar las cookies desde la configuración de su navegador. Bloquear determinadas cookies puede afectar al funcionamiento del sitio. Cuando sea obligatorio, solicitaremos su consentimiento antes de utilizar cookies no esenciales.',
          },
        ],
      },
      {
        heading: '6. Transferencias internacionales',
        blocks: [
          {
            type: 'p',
            text: 'Podemos tratar información en los Estados Unidos y en otros países. Si transferimos información personal desde el EEE, el Reino Unido o Suiza a países que no se consideren con un nivel adecuado de protección, utilizaremos garantías apropiadas, como las Cláusulas Contractuales Tipo de la UE u otros mecanismos legales, salvo que resulte aplicable una excepción.',
          },
        ],
      },
      {
        heading: '7. Conservación',
        blocks: [
          {
            type: 'p',
            text: 'Conservamos la información personal solo durante el tiempo necesario para los fines descritos, salvo que la ley exija o permita un plazo mayor. Los criterios incluyen la naturaleza de los datos, el riesgo de perjuicio y los requisitos legales o de negocio (por ejemplo, la conservación de registros por motivos fiscales o de litigio). Cuando ya no es necesaria, eliminamos, anonimizamos o agregamos la información.',
          },
        ],
      },
      {
        heading: '8. Seguridad',
        blocks: [
          {
            type: 'p',
            text: 'Aplicamos medidas técnicas y organizativas adecuadas para proteger la información personal. Ningún sistema es completamente seguro. Le pedimos que utilice credenciales robustas y únicas y que informe de inmediato de cualquier acceso no autorizado que sospeche.',
          },
        ],
      },
      {
        heading: '9. Menores de edad',
        blocks: [
          {
            type: 'p',
            text: 'Los Servicios no se dirigen a menores de 16 años (o a la edad superior que exija su jurisdicción) y no recopilamos su información personal de forma consciente. Si cree que lo hemos hecho, contáctenos y tomaremos medidas para eliminar la información, conforme a la ley.',
          },
        ],
      },
      {
        heading: '10. Sus derechos y opciones',
        blocks: [
          {
            type: 'p',
            text: 'Según su ubicación, puede tener derecho a acceder, rectificar, eliminar o exportar su información personal, a limitar u oponerse a determinados tratamientos, o a retirar el consentimiento cuando corresponda. También puede tener derecho a presentar una reclamación ante una autoridad de control. Para ejercer sus derechos, contáctenos como se indica en la sección 12.',
          },
          {
            type: 'p',
            text: '**EEE y Reino Unido:** puede contar con derechos adicionales conforme al RGPD, incluidos la portabilidad de datos y la limitación del tratamiento, cuando resulten aplicables a nuestras actividades.',
          },
          {
            type: 'p',
            text: '**California (CCPA/CPRA):** si reside en California, tiene derecho a conocer, eliminar y rectificar su información personal, así como a oponerse a su "venta" o "puesta en común" para publicidad conductual entre contextos, según se definen esos términos. No "vendemos" información personal en el sentido tradicional, como se describe más arriba. No vendemos ni compartimos de forma consciente información personal de consumidores menores de 16 años para esos fines. Puede designar a un agente autorizado cuando esté permitido. No le trataremos de forma discriminatoria por ejercer sus derechos bajo la CCPA/CPRA. Para ejercerlos, contáctenos; verificaremos su solicitud y responderemos conforme a la ley.',
          },
        ],
      },
      {
        heading: '11. Comunicaciones comerciales',
        blocks: [
          {
            type: 'p',
            text: 'Cuando enviamos correos promocionales, puede darse de baja mediante el enlace incluido en el mensaje o contactándonos. Aun así, podremos enviarle avisos transaccionales o legales importantes.',
          },
        ],
      },
      {
        heading: '12. Contacto',
        blocks: [
          {
            type: 'p',
            text: 'Para solicitudes de privacidad o preguntas sobre esta política, contáctenos a través de [acta.build](https://acta.build). Responderemos conforme a la legislación aplicable, incluidos los plazos exigidos en su jurisdicción. También puede acudir a la autoridad de protección de datos de su país si tiene inquietudes que no podamos resolver.',
          },
        ],
      },
      {
        heading: '13. Cambios en esta política',
        blocks: [
          {
            type: 'p',
            text: 'Podemos actualizar esta Política de privacidad. Publicaremos la nueva versión en esta página y cambiaremos la fecha de "Última actualización". Si los cambios son sustanciales, daremos un aviso adicional conforme lo exija la ley.',
          },
        ],
      },
    ],
  },
};
