export const CHARACTERS=[
 {id:'penguin',name:'펭대리',emoji:'🐧',color:0xffb44f,tag:'날지는 못해도 추월은 합니다',kind:'penguin'},
 {id:'seal',name:'물개 회장',emoji:'🦭',color:0x8ad8c7,tag:'수염은 품격, 속도는 실력',kind:'seal'},
 {id:'fish',name:'고등어 씨',emoji:'🐟',color:0xf18cae,tag:'머리는 물고기, 출근은 오토바이',kind:'fish'},
 {id:'human',name:'잠수 알바',emoji:'🤿',color:0x66b9eb,tag:'이 팀에서 나만 사람인가요',kind:'human'},
];
export const characterById=id=>CHARACTERS.find(c=>c.id===id)||CHARACTERS[0];
export const characterLineup=id=>{const player=characterById(id);return [player,...CHARACTERS.filter(c=>c.id!==player.id)];};
