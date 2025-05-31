precision mediump float;

uniform sampler2D u_textures[8]; // Support up to 8 textures per batch
uniform float u_alpha;

varying vec2 v_texCoord;
varying vec4 v_color;
varying float v_textureIndex;

void main() {
  vec4 texColor = vec4(1.0);
  
  // Sample from the appropriate texture based on index
  int textureIndex = int(v_textureIndex);
  
  if (textureIndex == 0) {
    texColor = texture2D(u_textures[0], v_texCoord);
  } else if (textureIndex == 1) {
    texColor = texture2D(u_textures[1], v_texCoord);
  } else if (textureIndex == 2) {
    texColor = texture2D(u_textures[2], v_texCoord);
  } else if (textureIndex == 3) {
    texColor = texture2D(u_textures[3], v_texCoord);
  } else if (textureIndex == 4) {
    texColor = texture2D(u_textures[4], v_texCoord);
  } else if (textureIndex == 5) {
    texColor = texture2D(u_textures[5], v_texCoord);
  } else if (textureIndex == 6) {
    texColor = texture2D(u_textures[6], v_texCoord);
  } else if (textureIndex == 7) {
    texColor = texture2D(u_textures[7], v_texCoord);
  }
  
  // Apply vertex color and global alpha
  vec4 finalColor = texColor * v_color;
  finalColor.a *= u_alpha;
  
  gl_FragColor = finalColor;
}
