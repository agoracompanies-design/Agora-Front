import { useMemo } from 'react';
import qr from 'qrcode-generator';

/**
 * Un enlace en código QR, dibujado aquí mismo.
 *
 * **Sin pedírselo a nadie.** Los servicios que devuelven un QR por URL son
 * cómodos, pero mandarían fuera la dirección del negocio y no funcionarían sin
 * conexión, que es cuando más falta hace: el dueño enseñando el código en su
 * mostrador.
 *
 * Va en SVG y no en imagen porque un QR son cuadrados negros: pesa poco y se
 * imprime nítido a cualquier tamaño, que es justo lo que se va a hacer con él.
 *
 * **Este fichero se carga aparte.** La librería son unos 52 kB y solo hacen
 * falta a quien tiene un negocio; quien lo importe debe hacerlo con `lazy()`.
 */
export default function QrDeEnlace({
  enlace,
  tamano = 200,
}: {
  enlace: string;
  /** El lado en píxeles. Por debajo de 150 cuesta leerlo desde un móvil. */
  tamano?: number;
}) {
  const dibujo = useMemo(() => {
    // Tipo 0 = el más pequeño en el que quepa. `M` corrige hasta un 15 % de
    // daño: aguanta un papel doblado o un cartel rozado sin volverse más denso.
    const codigo = qr(0, 'M');
    codigo.addData(enlace);
    codigo.make();

    const lado = codigo.getModuleCount();
    const celdas: string[] = [];
    for (let fila = 0; fila < lado; fila++) {
      for (let col = 0; col < lado; col++) {
        if (codigo.isDark(fila, col)) celdas.push(`M${col} ${fila}h1v1h-1z`);
      }
    }
    return { lado, camino: celdas.join('') };
  }, [enlace]);

  // Un borde de cuatro módulos: sin él muchos lectores no encuentran el código.
  const margen = 4;
  const total = dibujo.lado + margen * 2;

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      width={tamano}
      height={tamano}
      className="qr rounded-xl"
      role="img"
      aria-label="Código QR con el enlace de tu negocio"
      shapeRendering="crispEdges"
    >
      {/* Blanco y negro fijos, no los del tema: un QR en modo oscuro deja de
          leerse, y este está para que lo escanee otro teléfono. */}
      <rect width={total} height={total} fill="#ffffff" />
      <g transform={`translate(${margen} ${margen})`} fill="#111827">
        <path d={dibujo.camino} />
      </g>
    </svg>
  );
}
