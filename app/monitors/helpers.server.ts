import { NodeSSH } from 'node-ssh';

export function disposeSsh(ssh: NodeSSH) {
	if (ssh.connection) {
		// @ts-ignore
		ssh.getConnection().end();
		ssh.connection.on('error', function () {
			/* No Op */
		});
		ssh.dispose();
	}
}
