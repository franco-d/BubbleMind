<?php
require_once 'mySqlConnection.php';

if (isset($_GET['idFile']) and is_numeric($_GET['idFile']))
{
	$sql = MySqlConnection::getConnection();
	$query = "SELECT id,name FROM entities WHERE idFile = '" . $_GET["idFile"] . "'";
	$ret = mysql_query($query);
	$entities = array();
	while ($line = mysql_fetch_assoc($ret)) {
		$entities[$line['id']] = $line['name'];
	}
	$resp = json_encode($entities, JSON_FORCE_OBJECT);
	echo $resp;
}