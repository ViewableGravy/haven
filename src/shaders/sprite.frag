precision mediump float;

uniform sampler2D u_texture;
uniform float u_alpha;

varying vec2 v_texCoord;
varying vec4 v_color;

void main() {
  // Sample texture
  vec4 texColor = texture2D(u_texture, v_texCoord);
  
  // Apply vertex color and global alpha
  vec4 finalColor = texColor * v_color;
  finalColor.a *= u_alpha;
  
  gl_FragColor = finalColor;
}
