attribute vec2 a_position;
attribute vec2 a_texCoord;
attribute vec4 a_color;
attribute float a_textureIndex;

uniform mat3 u_projection;
uniform mat3 u_view;

varying vec2 v_texCoord;
varying vec4 v_color;
varying float v_textureIndex;

void main() {
  // Transform position through view and projection matrices
  vec3 position = u_projection * u_view * vec3(a_position, 1.0);
  
  gl_Position = vec4(position.xy, 0.0, 1.0);
  
  // Pass attributes to fragment shader
  v_texCoord = a_texCoord;
  v_color = a_color;
  v_textureIndex = a_textureIndex;
}
