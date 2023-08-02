export function disposeSsh(ssh) {
	if (ssh.connection) {
		ssh.getConnection().end();
		ssh.connection.on('error', function () {
			/* No Op */
		});
		ssh.dispose();
	}
}
