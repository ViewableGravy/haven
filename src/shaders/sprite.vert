attribute vec2 a_position;
attribute vec2 a_texCoord;
attribute vec4 a_color;

uniform mat3 u_projection;
uniform mat3 u_view;
uniform mat3 u_model;

varying vec2 v_texCoord;
varying vec4 v_color;

void main() {
  // Transform position through model, view, and projection matrices
  vec3 position = u_projection * u_view * u_model * vec3(a_position, 1.0);
  
  gl_Position = vec4(position.xy, 0.0, 1.0);
  
  // Pass texture coordinates and color to fragment shader
  v_texCoord = a_texCoord;
  v_color = a_color;
}
