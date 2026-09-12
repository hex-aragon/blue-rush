import * as THREE from 'three';
import {Water} from 'three/addons/objects/Water.js';
// Water spectrum, Fresnel response and foam crests inherited from Korean Blue Voyage v1.18.0.
export function createWater(){
const holder={};
 const normals=new THREE.TextureLoader().load(import.meta.env.BASE_URL+'waternormals.jpg');normals.wrapS=normals.wrapT=THREE.RepeatWrapping;
 const waterGrid=new THREE.PlaneGeometry(2400,2400,200,200);
 holder.water=new Water(waterGrid,{textureWidth:512,textureHeight:512,waterNormals:normals,sunDirection:new THREE.Vector3(),sunColor:0xffedcf,waterColor:0x176777,distortionScale:3.2,fog:true});
 holder.water.rotation.x=-Math.PI/2;holder.water.material.uniforms.waveStrength={value:1};
 holder.water.material.vertexShader=holder.water.material.vertexShader.replace('#include <common>','#include <common>\nuniform float waveStrength;').replace('mirrorCoord = modelMatrix * vec4( position, 1.0 );',`vec3 p=position; vec4 wp=modelMatrix*vec4(p,1.0); p.z+=waveStrength*(sin(wp.x*.022+wp.z*.014-time*1.2)*.72+sin(wp.x*.051-wp.z*.027-time*1.7)*.3+sin(wp.z*.085+wp.x*.03-time*2.1)*.12+sin(wp.x*.007+wp.z*.010-time*.52)*.35); mirrorCoord = modelMatrix * vec4(p,1.0);`).replace('modelViewMatrix * vec4( position, 1.0 )','modelViewMatrix * vec4( p, 1.0 )');
 holder.water.material.fragmentShader=holder.water.material.fragmentShader.replace('uniform float time;', 'uniform float time;\nuniform float waveStrength;').replace('vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );', `vec2 wp=worldPosition.xz;vec2 slope=waveStrength*(vec2(.022,.014)*.72*cos(wp.x*.022+wp.y*.014-time*1.2)+vec2(.051,-.027)*.3*cos(wp.x*.051-wp.y*.027-time*1.7)+vec2(.03,.085)*.12*cos(wp.y*.085+wp.x*.03-time*2.1)+vec2(.007,.010)*.35*cos(wp.x*.007+wp.y*.010-time*.52));vec3 surfaceNormal=normalize(noise.xzy*vec3(1.5,1.0,1.5)+vec3(-slope.x,0.0,-slope.y));`);
 holder.water.material.fragmentShader=holder.water.material.fragmentShader.replace('float rf0 = 0.3;', 'float rf0 = 0.025;').replace('vec3 outgoingLight = albedo;', `float crest=smoothstep(.045,.12,length(slope))*smoothstep(.0,.8,sin(wp.x*.022+wp.y*.014-time*1.2))*smoothstep(.9,2.8,waveStrength);float broken=smoothstep(.12,.55,abs(noise.x)+abs(noise.y));vec3 outgoingLight=mix(albedo,vec3(.72,.83,.80),crest*broken*min(.65,.14+waveStrength*.07));`);

holder.water.material.uniforms.sunDirection.value.set(-.3,.6,-.6).normalize();return holder.water;
}
