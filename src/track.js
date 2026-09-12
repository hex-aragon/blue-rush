import * as T from 'three';
import {mod} from './game.js';
export function createTrack(course){
 const points=[[0,0,0],[5,0,-160],[-85,0,-295],[-250,0,-290],[-345,0,-180],[-260,0,-45],[-330,0,115],[-205,0,260],[-40,0,235],[95,0,125],[130,0,-5],[65,0,-55]];
 const depths=course.id==='abyss'?[-52,-66,-90,-108,-120,-112,-95,-78,-55,-48,-42,-46]:course.id==='sunset'?[0,0,-1,-8,-16,-10,0,0,0,0,0,0]:[0,0,-14,-40,-58,-55,-32,-12,0,0,0,0];
 const curve=new T.CatmullRomCurve3(points.map((p,i)=>new T.Vector3(p[0],depths[i],p[2])),true,'catmullrom',.35);curve.arcLengthDivisions=2400;curve.updateArcLengths();const length=curve.getLength();
 function sample(distance,x=0){const u=mod(distance,length)/length,p=curve.getPointAt(u),t=curve.getTangentAt(u).normalize(),right=new T.Vector3(-t.z,0,t.x).normalize();return {p:p.addScaledVector(right,x),t,right,u};}
 return {curve,length,sample};
}
