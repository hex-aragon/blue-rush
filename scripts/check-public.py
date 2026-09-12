from pathlib import Path
import re,sys
root=Path(sys.argv[1] if len(sys.argv)>1 else 'dist')
assert root.is_dir(), 'Build directory missing'
bad=[]
patterns=[rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',rb'gh[pousr]_[A-Za-z0-9]{30,}',rb'sk-(?:proj-)?[A-Za-z0-9_-]{32,}',rb'AKIA[0-9A-Z]{16}',rb'github_pat_[A-Za-z0-9_]{30,}']
for p in root.rglob('*'):
 if not p.is_file():continue
 if p.name.startswith('.env') or p.suffix in ['.map','.pem','.key'] or '.git' in p.parts:bad.append(str(p))
 data=p.read_bytes()
 if any(re.search(x,data) for x in patterns):bad.append(str(p))
assert not bad,'Unexpected public files: '+', '.join(bad)
print('Public artifact check passed: no secret patterns, env files, source maps, or key files.')
